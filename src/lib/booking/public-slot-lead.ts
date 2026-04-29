/** Argentina: UTC-3 fijo sin DST desde 2009. */
export const RESERVATION_TZ = "America/Argentina/Buenos_Aires";

export const PUBLIC_MIN_LEAD_DAYS = 2;

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

/** Fecha mínima reservable (hoy + 2 días en hora Argentina). */
export function minPublicBookableDateKey(now = new Date()): string {
  return argentinaDateKey(
    new Date(now.getTime() + PUBLIC_MIN_LEAD_DAYS * 24 * 60 * 60 * 1000),
  );
}

/** true si la fecha viola la regla de anticipación mínima. */
export function isPublicLeadTimeViolated(dateKey: string, now = new Date()): boolean {
  return dateKey < minPublicBookableDateKey(now);
}
