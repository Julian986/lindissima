import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId as ObjectIdCtor } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { verifyPanelCookie } from "@/lib/panel-turnos-auth";
import { getScheduleTimesForDate } from "@/lib/booking/salon-schedule";
import { listAgendaBlocksForDate } from "@/lib/booking/agenda-blocks";
import { ensureReservationIndexes } from "@/lib/reservations/service";
import type { ReservationDoc } from "@/lib/reservations/types";

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  if (!verifyPanelCookie(cookieStore.get("panel_turnos_auth")?.value)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const dateKey = url.searchParams.get("dateKey")?.trim() ?? "";
  const excludeId = url.searchParams.get("excludeReservationHexId")?.trim() ?? "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ error: "Fecha inválida." }, { status: 400 });
  }

  const grillaTimes = getScheduleTimesForDate(dateKey);
  if (grillaTimes.length === 0) {
    return NextResponse.json({ rows: [] });
  }

  try {
    const db = await getDb();
    await ensureReservationIndexes(db);

    // Reservas activas ese día
    const excludeFilter = excludeId
      ? { _id: { $ne: new ObjectIdCtor(excludeId) } }
      : {};

    const [occupied, agendaBlocks] = await Promise.all([
      db
        .collection<ReservationDoc>("reservations")
        .find({
          ...excludeFilter,
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

    // Marcar slots cubiertos por bloques de agenda
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

    const rows = grillaTimes.map((t) => {
      const occ = occupiedMap.get(t);
      if (occ) {
        return { kind: "occupied" as const, timeLocal: t, customerName: occ.customerName, treatmentName: occ.treatmentName };
      }
      return { kind: "available" as const, timeLocal: t };
    });

    return NextResponse.json({ rows });
  } catch (e) {
    console.error("[api/panel-turnos/reprogramar/day-slots]", e);
    return NextResponse.json({ error: "No se pudo cargar la agenda del día." }, { status: 500 });
  }
}
