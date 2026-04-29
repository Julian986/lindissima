import type { ReservationDoc, ReservationSource, ReservationStatus } from "./types";

export type CustomerReservationPublic = {
  id: string;
  customerName: string;
  customerPhone: string;
  treatmentId: string;
  treatmentName: string;
  subtitle: string;
  category: string;
  dateKey: string;
  timeLocal: string;
  displayDate: string;
  startsAtIso: string;
  durationMinutes: number;
  reservationStatus: ReservationStatus;
  paymentStatus: string;
  source: ReservationSource;
  cancelledBy?: "panel" | "customer" | null;
};

export function serializeReservationForCustomer(r: ReservationDoc): CustomerReservationPublic {
  const dur =
    typeof r.durationMinutes === "number" && Number.isFinite(r.durationMinutes) && r.durationMinutes > 0
      ? r.durationMinutes
      : 60;
  return {
    id: r._id.toHexString(),
    customerName: String(r.customerName ?? "").trim() || "Cliente",
    customerPhone: String(r.customerPhone ?? "").trim(),
    treatmentId: String(r.treatmentId ?? "").trim(),
    treatmentName: r.treatmentName,
    subtitle: r.subtitle,
    category: r.category,
    dateKey: r.dateKey,
    timeLocal: r.timeLocal,
    displayDate: r.displayDate,
    startsAtIso: r.startsAt instanceof Date ? r.startsAt.toISOString() : String(r.startsAt),
    durationMinutes: dur,
    reservationStatus: r.reservationStatus,
    paymentStatus: r.paymentStatus,
    source: r.source ?? "app_turnos",
    cancelledBy: r.cancelledBy ?? null,
  };
}

/** Fin del turno en ms (inicio + duración). */
export function reservationEndMs(r: Pick<CustomerReservationPublic, "startsAtIso" | "durationMinutes">): number {
  const start = new Date(r.startsAtIso).getTime();
  return start + r.durationMinutes * 60_000;
}

/** Próximos: turno aún no terminó y no está cancelado / no_show. */
export function isUpcomingReservation(r: CustomerReservationPublic, nowMs = Date.now()): boolean {
  if (r.reservationStatus === "no_show") return false;
  if (r.reservationStatus === "cancelled") {
    if (r.cancelledBy === "panel") return reservationEndMs(r) >= nowMs;
    return false;
  }
  return reservationEndMs(r) >= nowMs;
}
