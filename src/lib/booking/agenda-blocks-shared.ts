/**
 * Reglas de bloqueo de agenda sin dependencias de Node/Mongo (seguro para Client Components).
 * Lindissima: solo scope "salon" (profesional única).
 */

export type AgendaBlockScope = "salon";

export type AgendaBlockRecurrence =
  | null
  | {
      type: "weekly";
      untilDateKey?: string | null;
    };

export type AgendaBlockRule = {
  anchorDateKey: string;
  recurrence: AgendaBlockRecurrence;
};

export function parseDateKeyLocal(dateKey: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

function sameWeekday(aKey: string, bKey: string): boolean {
  const a = parseDateKeyLocal(aKey);
  const b = parseDateKeyLocal(bKey);
  if (!a || !b) return false;
  return a.getDay() === b.getDay();
}

export function agendaBlockAppliesToDateKey(doc: AgendaBlockRule, dateKey: string): boolean {
  if (!doc.recurrence) {
    return doc.anchorDateKey === dateKey;
  }
  if (doc.recurrence.type !== "weekly") return false;
  if (dateKey < doc.anchorDateKey) return false;
  if (!sameWeekday(doc.anchorDateKey, dateKey)) return false;
  const until = doc.recurrence.untilDateKey?.trim();
  if (until && dateKey > until) return false;
  return true;
}
