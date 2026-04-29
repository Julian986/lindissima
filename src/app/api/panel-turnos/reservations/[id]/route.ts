import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { verifyPanelCookie } from "@/lib/panel-turnos-auth";
import {
  cancelReservation,
  ensureReservationIndexes,
  findReservationByHexId,
  rescheduleReservation,
} from "@/lib/reservations/service";
import type { ReservationDoc } from "@/lib/reservations/types";

export const dynamic = "force-dynamic";

function serializePanelOne(r: ReservationDoc) {
  return {
    id: r._id.toHexString(),
    treatmentId: r.treatmentId,
    treatmentName: r.treatmentName,
    subtitle: r.subtitle,
    category: r.category,
    dateKey: r.dateKey,
    timeLocal: r.timeLocal,
    displayDate: r.displayDate,
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    reservationStatus: r.reservationStatus,
    paymentStatus: r.paymentStatus,
    cancelledBy: r.cancelledBy ?? null,
    source: r.source ?? "app_turnos",
    startsAt: r.startsAt instanceof Date ? r.startsAt.toISOString() : String(r.startsAt),
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!verifyPanelCookie(cookieStore.get("panel_turnos_auth")?.value)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const db = await getDb();
    await ensureReservationIndexes(db);
    const doc = await findReservationByHexId(db, id.trim());
    if (!doc) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    return NextResponse.json(serializePanelOne(doc));
  } catch (e) {
    console.error("[api/panel-turnos/reservations/[id] GET]", e);
    return NextResponse.json({ error: "No se pudo cargar el turno." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!verifyPanelCookie(cookieStore.get("panel_turnos_auth")?.value)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const dateKey = typeof body === "object" && body && "dateKey" in body ? String((body as Record<string, unknown>).dateKey ?? "").trim() : "";
  const timeLocal = typeof body === "object" && body && "timeLocal" in body ? String((body as Record<string, unknown>).timeLocal ?? "").trim() : "";

  try {
    const db = await getDb();
    await ensureReservationIndexes(db);
    const result = await rescheduleReservation(db, {
      reservationHexId: id.trim(),
      newDateKey: dateKey,
      newTimeLocal: timeLocal,
      now: new Date(),
      actor: "panel",
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/panel-turnos/reservations/[id] PATCH]", e);
    return NextResponse.json({ error: "No se pudo actualizar el turno." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!verifyPanelCookie(cookieStore.get("panel_turnos_auth")?.value)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  let body: unknown = null;
  try {
    body = await request.json();
  } catch { body = null; }
  const cancelReason =
    typeof body === "object" && body && "cancelReason" in body
      ? String((body as Record<string, unknown>).cancelReason ?? "").trim()
      : "";

  try {
    const db = await getDb();
    await ensureReservationIndexes(db);
    const result = await cancelReservation(db, {
      reservationHexId: id.trim(),
      now: new Date(),
      actor: "panel",
      cancelReason: cancelReason || undefined,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/panel-turnos/reservations/[id] DELETE]", e);
    return NextResponse.json({ error: "No se pudo cancelar el turno." }, { status: 500 });
  }
}
