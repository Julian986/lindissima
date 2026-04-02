import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyPanelCookie } from "@/lib/panel-turnos-auth";
import { listReservationsForCalendarMonth } from "@/lib/reservations/admin-queries";
import type { ReservationDoc } from "@/lib/reservations/types";

function serialize(r: ReservationDoc) {
  return {
    id: r._id.toHexString(),
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
    externalReference: r.externalReference ?? null,
    preferenceId: r.preferenceId ?? null,
    mpPaymentId: r.mpPaymentId ?? null,
    mpPaymentStatusLast: r.mpPaymentStatusLast ?? null,
    mpPaymentApprovedAt:
      r.mpPaymentApprovedAt instanceof Date
        ? r.mpPaymentApprovedAt.toISOString()
        : r.mpPaymentApprovedAt
          ? String(r.mpPaymentApprovedAt)
          : null,
    paymentDeadlineAt:
      r.paymentDeadlineAt instanceof Date
        ? r.paymentDeadlineAt.toISOString()
        : r.paymentDeadlineAt
          ? String(r.paymentDeadlineAt)
          : null,
    startsAt: r.startsAt instanceof Date ? r.startsAt.toISOString() : String(r.startsAt),
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  if (!verifyPanelCookie(cookieStore.get("panel_turnos_auth")?.value)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const y = Number(url.searchParams.get("year"));
  const m = Number(url.searchParams.get("month"));
  if (!Number.isFinite(y) || y < 2000 || y > 2100 || !Number.isFinite(m) || m < 1 || m > 12) {
    return NextResponse.json({ error: "Año o mes inválido." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const list = await listReservationsForCalendarMonth(db, y, m);
    return NextResponse.json({ reservations: list.map(serialize) });
  } catch (e) {
    console.error("[panel-turnos reservations GET]", e);
    return NextResponse.json({ error: "No se pudieron cargar las reservas." }, { status: 500 });
  }
}
