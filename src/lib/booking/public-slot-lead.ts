/** Argentina: UTC-3 fijo sin DST desde 2009. */
export const RESERVATION_TZ = "America/Argentina/Buenos_Aires";

export const PUBLIC_MIN_LEAD_DAYS = 0;

function argentinaDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: RESERVATION_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

export function argentinaTodayDateKey(now = new Date()): string {
  return argentinaDateKey(now);
}

/** Fecha mínima reservable (hoy en hora Argentina). */
export function minPublicBookableDateKey(now = new Date()): string {
  return argentinaDateKey(
    new Date(now.getTime() + PUBLIC_MIN_LEAD_DAYS * 24 * 60 * 60 * 1000),
  );
}

/** true si la fecha viola la regla de anticipación mínima. */
export function isPublicLeadTimeViolated(dateKey: string, now = new Date()): boolean {
  return dateKey < minPublicBookableDateKey(now);
}

/** Hora actual en Argentina como "HH:MM". */
export function argentinaCurrentTimeHHMM(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: RESERVATION_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mn = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${mn}`;
}

/**
 * true si el slot "HH:MM" ya pasó para el día de hoy en Argentina.
 * Para días futuros siempre devuelve false.
 * Solo aplicar para reservas públicas (no para el panel).
 */
export function isPastSlotForPublic(dateKey: string, timeLocal: string, now = new Date()): boolean {
  const today = argentinaTodayDateKey(now);
  if (dateKey !== today) return false;
  return timeLocal <= argentinaCurrentTimeHHMM(now);
}
