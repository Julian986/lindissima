import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId as ObjectIdCtor, type ObjectId } from "mongodb";

import { canonicalPhoneDigitsAR, customerPhoneDigitsQueryValues } from "@/lib/customer/phone-canonical-ar";
import { CUSTOMER_PROFILE_COOKIE, readCustomerProfilePhoneDigits } from "@/lib/customer/customer-session";
import { getScheduleTimesForDate } from "@/lib/booking/salon-schedule";
import { isPublicLeadTimeViolated, isPastSlotForPublic } from "@/lib/booking/public-slot-lead";
import { listAgendaBlocksForDate } from "@/lib/booking/agenda-blocks";
import { getDb } from "@/lib/mongodb";
import { findReservationByHexId, ensureReservationIndexes } from "@/lib/reservations/service";
import type { ReservationDoc } from "@/lib/reservations/types";

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export const dynamic = "force-dynamic";

export type ReprogramDayRow =
  | { kind: "available"; timeLocal: string }
  | { kind: "occupied"; timeLocal: string; customerName: string; treatmentName: string };

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const hex = id.trim();

  const url = new URL(request.url);
  const dateKey = url.searchParams.get("dateKey")?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ error: "Fecha inválida." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(CUSTOMER_PROFILE_COOKIE)?.value;
  const fromCookie = readCustomerProfilePhoneDigits(raw);
  if (!fromCookie) return NextResponse.json({ error: "No iniciaste sesión." }, { status: 401 });
  const digits = canonicalPhoneDigitsAR(fromCookie);
  if (!digits) return NextResponse.json({ error: "No iniciaste sesión." }, { status: 401 });

  try {
    const db = await getDb();
    await ensureReservationIndexes(db);

    // Verificar ownership de la reserva
    const doc = await findReservationByHexId(db, hex);
    if (!doc) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    const docDigits = doc.customerPhoneDigits ?? canonicalPhoneDigitsAR(doc.customerPhone);
    if (!customerPhoneDigitsQueryValues(digits).includes(docDigits)) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }

    // Si la reserva es de web pública, aplicar regla de anticipación
    if (isPublicLeadTimeViolated(dateKey)) {
      return NextResponse.json({
        rows: [] satisfies ReprogramDayRow[],
        leadTimeError: "No podés reprogramar a una fecha pasada.",
      });
    }

    // Horarios de la grilla para ese día (para hoy, excluir slots ya pasados)
    const allGrillaTimes = getScheduleTimesForDate(dateKey);
    const grillaTimes = allGrillaTimes.filter((t) => !isPastSlotForPublic(dateKey, t));
    if (grillaTimes.length === 0) {
      return NextResponse.json({ rows: [] satisfies ReprogramDayRow[] });
    }

    // Reservas activas ese día (excluyendo la actual)
    let excludeOid: ObjectId;
    try { excludeOid = new ObjectIdCtor(hex); } catch {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const [occupied, agendaBlocks] = await Promise.all([
      db
        .collection<ReservationDoc>("reservations")
        .find({
          _id: { $ne: excludeOid },
          dateKey,
          reservationStatus: { $in: ["pending_payment", "confirmed"] },
        })
        .project<{ timeLocal: string; customerName: string; treatmentName: string }>({
          timeLocal: 1, customerName: 1, treatmentName: 1,
        })
        .toArray(),
      listAgendaBlocksForDate(db, dateKey),
    ]);

    const occupiedMap = new Map(occupied.map((r) => [r.timeLocal, r]));

    // Marcar slots cubiertos por bloques de agenda como ocupados
    for (const block of agendaBlocks) {
      const blockStart = toMinutes(block.timeLocal);
      const blockEnd = blockStart + block.durationMinutes;
      for (const slot of grillaTimes) {
        const sm = toMinutes(slot);
        if (sm >= blockStart && sm < blockEnd && !occupiedMap.has(slot)) {
          occupiedMap.set(slot, { timeLocal: slot, customerName: "Bloqueo de agenda", treatmentName: block.notes ?? "Bloqueado" });
        }
      }
    }

    const rows: ReprogramDayRow[] = grillaTimes.map((t) => {
      const occ = occupiedMap.get(t);
      if (occ) {
        return { kind: "occupied", timeLocal: t, customerName: occ.customerName, treatmentName: occ.treatmentName };
      }
      return { kind: "available", timeLocal: t };
    });

    return NextResponse.json({ rows });
  } catch (e) {
    console.error("[api/me/reservations/[id]/day-slots]", e);
    return NextResponse.json({ error: "No se pudo cargar la agenda del día." }, { status: 500 });
  }
}

