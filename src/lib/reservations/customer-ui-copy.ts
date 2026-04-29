import type { ReservationStatus } from "./types";

import { reservationEndMs, type CustomerReservationPublic } from "./customer-public-serialize";

export function formatShortDateFromKey(dateKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!m) return dateKey;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function reservationStatusLabel(status: ReservationStatus): string {
  switch (status) {
    case "pending_payment":
      return "Pendiente de pago";
    case "confirmed":
      return "Confirmado";
    case "completed":
      return "Realizado";
    case "cancelled":
      return "Cancelado";
    case "no_show":
      return "No asistió";
    default:
      return status;
  }
}

/** Sesión contada como "realizada" en historial (visitó o cierre operativo). */
export function isPastSessionForHistory(r: CustomerReservationPublic, nowMs = Date.now()): boolean {
  if (r.reservationStatus === "pending_payment") return false;
  if (r.reservationStatus === "cancelled" || r.reservationStatus === "no_show") return false;
  if (r.reservationStatus === "completed") return true;
  return reservationEndMs(r) < nowMs;
}
