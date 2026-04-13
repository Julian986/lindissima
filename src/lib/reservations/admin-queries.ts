import type { Db } from "mongodb";
import type { ReservationDoc } from "./types";

const COLLECTION = "reservations";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** month: 1–12 (enero = 1) */
export async function listReservationsForCalendarMonth(
  db: Db,
  year: number,
  month: number,
): Promise<ReservationDoc[]> {
  const last = new Date(year, month, 0).getDate();
  const from = `${year}-${pad2(month)}-01`;
  const to = `${year}-${pad2(month)}-${pad2(last)}`;

  return db
    .collection<ReservationDoc>(COLLECTION)
    .find({ dateKey: { $gte: from, $lte: to } })
    .sort({ dateKey: 1, timeLocal: 1 })
    .toArray();
}

/**
 * Devuelve reservas activas (bloquean agenda) para el calendario público.
 * Incluye pendientes de pago y confirmadas.
 */
export async function listActiveReservationsForCalendarMonth(
  db: Db,
  year: number,
  month: number,
): Promise<Pick<ReservationDoc, "dateKey" | "timeLocal">[]> {
  const last = new Date(year, month, 0).getDate();
  const from = `${year}-${pad2(month)}-01`;
  const to = `${year}-${pad2(month)}-${pad2(last)}`;

  return db
    .collection<ReservationDoc>(COLLECTION)
    .find(
      {
        dateKey: { $gte: from, $lte: to },
        reservationStatus: { $in: ["pending_payment", "confirmed"] },
      },
      { projection: { _id: 0, dateKey: 1, timeLocal: 1 } },
    )
    .toArray();
}

export function computeReminder24hWindow(now: Date, windowMinutes: number): { lower: Date; upper: Date } {
  const w = Math.max(1, windowMinutes) * 60 * 1000;
  return {
    lower: new Date(now.getTime() + MS_PER_DAY - w),
    upper: new Date(now.getTime() + MS_PER_DAY + w),
  };
}

/**
 * Reservas confirmadas con opt-in, dentro de la ventana ~24h antes del turno, sin recordatorio ya enviado.
 */
export async function findReservationsNeedingReminder24h(
  db: Db,
  now: Date,
  windowMinutes: number,
): Promise<ReservationDoc[]> {
  const { lower, upper } = computeReminder24hWindow(now, windowMinutes);
  return db
    .collection<ReservationDoc>(COLLECTION)
    .find({
      reservationStatus: "confirmed",
      whatsappOptIn: true,
      startsAt: { $gte: lower, $lte: upper },
      $or: [{ waReminder24hSentAt: { $exists: false } }, { waReminder24hSentAt: null }],
    })
    .toArray();
}

function ymdInArgentina(date: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

/**
 * Recordatorio D-1 (10am cron diario): todos los turnos del día siguiente en hora Argentina.
 */
export async function findReservationsNeedingReminderNextDayAr(
  db: Db,
  now: Date,
): Promise<ReservationDoc[]> {
  const tomorrowUtc = new Date(now.getTime() + MS_PER_DAY);
  const targetDateKey = ymdInArgentina(tomorrowUtc);
  return db
    .collection<ReservationDoc>(COLLECTION)
    .find({
      reservationStatus: "confirmed",
      whatsappOptIn: true,
      dateKey: targetDateKey,
      $or: [{ waReminder24hSentAt: { $exists: false } }, { waReminder24hSentAt: null }],
    })
    .toArray();
}
