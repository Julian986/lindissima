/**
 * Horarios disponibles del salón.
 * Fuente única de verdad: se usa tanto en el flujo de nueva reserva (turnos-client)
 * como en la reprogramación desde el perfil.
 */

export const availableTimesByWeekday: Record<number, string[]> = {
  1: ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00"],
  2: ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00"],
  3: ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00"],
  4: ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
  5: ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00"],
  6: ["08:00", "09:00", "10:00", "11:00", "12:00"],
};

/** Excepciones manuales (prioridad sobre la plantilla semanal). */
export const availableTimesByDateOverride: Record<string, string[]> = {
  "2026-03-30": ["09:00", "16:30", "18:15"],
  "2026-03-31": ["10:00", "17:00", "18:00"],
  "2026-04-01": ["08:00", "10:00", "11:00", "12:00", "17:00"],
  "2026-04-04": ["09:00", "10:00", "11:00", "12:00"],
  "2026-04-07": ["10:00", "11:00", "15:00", "16:00", "17:30", "18:30"],
  "2026-04-08": ["08:00", "09:00", "10:00", "10:30", "15:00", "16:00"],
  "2026-04-09": ["08:00", "09:00", "10:00"],
  "2026-04-10": ["11:00", "15:00", "16:00", "17:30", "18:30"],
  "2026-04-11": ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"],
};

/** Horarios de la grilla para una fecha dada (sin filtrar ocupados). */
export function getScheduleTimesForDate(dateKey: string): string[] {
  const override = availableTimesByDateOverride[dateKey];
  if (override) return override;
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return [];
  const dt = new Date(y, m - 1, d);
  return availableTimesByWeekday[dt.getDay()] ?? [];
}

const weekdayLabelsEs = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const monthNamesEs = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** "Lun, 5 may" — usado en displayDate al reprogramar. */
export function formatSalonDisplayDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  const dt = new Date(y, m - 1, d);
  const dow = weekdayLabelsEs[dt.getDay()];
  const mon = monthNamesEs[m - 1]?.slice(0, 3).toLowerCase() ?? "";
  return `${dow}, ${d} ${mon}`;
}

export const WEEK_LETTERS = ["D", "L", "M", "X", "J", "V", "S"];

export type CalendarCell = {
  dateKey: string;
  day: number;
  inMonth: boolean;
};

/** Grilla de 35 celdas para un mes (empieza en domingo). */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month - 1, 1);
  const startOffset = first.getDay();
  const gridStart = new Date(year, month - 1, 1 - startOffset);

  return Array.from({ length: 35 }, (_, i) => {
    const dt = new Date(gridStart);
    dt.setDate(gridStart.getDate() + i);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return {
      dateKey: `${y}-${m}-${d}`,
      day: dt.getDate(),
      inMonth: dt.getMonth() === month - 1,
    };
  });
}

export function monthTitle(year: number, month: number): string {
  return `${monthNamesEs[month - 1]} ${year}`;
}
