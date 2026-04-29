import type { Db, ObjectId } from "mongodb";
import { ObjectId as ObjectIdCtor } from "mongodb";

import {
  type AgendaBlockRecurrence,
  type AgendaBlockScope,
  agendaBlockAppliesToDateKey,
  parseDateKeyLocal,
} from "@/lib/booking/agenda-blocks-shared";
import { formatSalonDisplayDate } from "@/lib/booking/salon-schedule";

export type { AgendaBlockRecurrence, AgendaBlockScope } from "@/lib/booking/agenda-blocks-shared";
export { agendaBlockAppliesToDateKey } from "@/lib/booking/agenda-blocks-shared";

export const AGENDA_BLOCKS_COLLECTION = "salon_agenda_blocks";

export type SalonAgendaBlockDoc = {
  _id: ObjectId;
  anchorDateKey: string;
  anchorWeekday: number;
  timeLocal: string;
  durationMinutes: number;
  startsAt: Date;
  displayDate: string;
  scope: AgendaBlockScope;
  recurrence: AgendaBlockRecurrence;
  notes?: string | null;
  createdAt: Date;
};

const INDEXES_VERSION = 1;
let indexesApplied = 0;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export async function ensureAgendaBlockIndexes(db: Db) {
  if (indexesApplied >= INDEXES_VERSION) return;
  const col = db.collection(AGENDA_BLOCKS_COLLECTION);
  await col.createIndex({ anchorDateKey: 1 }, { name: "ab_anchor" });
  await col.createIndex({ "recurrence.type": 1, anchorWeekday: 1, anchorDateKey: 1 }, { name: "ab_weekly_lookup" });
  indexesApplied = INDEXES_VERSION;
}

export async function listAgendaBlocksForCalendarMonth(
  db: Db,
  year: number,
  month: number,
): Promise<SalonAgendaBlockDoc[]> {
  await ensureAgendaBlockIndexes(db);
  const last = new Date(year, month, 0).getDate();
  const from = `${year}-${pad2(month)}-01`;
  const to = `${year}-${pad2(month)}-${pad2(last)}`;
  const col = db.collection<SalonAgendaBlockDoc>(AGENDA_BLOCKS_COLLECTION);
  return col
    .find({
      $or: [
        {
          $or: [{ recurrence: null }, { recurrence: { $exists: false } }],
          anchorDateKey: { $gte: from, $lte: to },
        },
        {
          "recurrence.type": "weekly",
          anchorDateKey: { $lte: to },
          $or: [
            { "recurrence.untilDateKey": null },
            { "recurrence.untilDateKey": { $exists: false } },
            { "recurrence.untilDateKey": "" },
            { "recurrence.untilDateKey": { $gte: from } },
          ],
        },
      ],
    })
    .sort({ anchorDateKey: 1, timeLocal: 1 })
    .toArray();
}

/** Bloqueos que aplican a un día específico. */
export async function listAgendaBlocksForDate(db: Db, dateKey: string): Promise<SalonAgendaBlockDoc[]> {
  await ensureAgendaBlockIndexes(db);
  const wd = parseDateKeyLocal(dateKey)?.getDay();
  if (wd === undefined) return [];

  const col = db.collection<SalonAgendaBlockDoc>(AGENDA_BLOCKS_COLLECTION);
  const rows = await col
    .find({
      $or: [
        {
          anchorDateKey: dateKey,
          $or: [{ recurrence: null }, { recurrence: { $exists: false } }],
        },
        {
          "recurrence.type": "weekly",
          anchorWeekday: wd,
          anchorDateKey: { $lte: dateKey },
          $or: [
            { "recurrence.untilDateKey": null },
            { "recurrence.untilDateKey": { $exists: false } },
            { "recurrence.untilDateKey": "" },
            { "recurrence.untilDateKey": { $gte: dateKey } },
          ],
        },
      ],
    })
    .toArray();

  return rows.filter((doc) => agendaBlockAppliesToDateKey(doc, dateKey));
}

export type InsertAgendaBlockInput = {
  anchorDateKey: string;
  timeLocal: string;
  durationMinutes: number;
  scope: AgendaBlockScope;
  recurrence: AgendaBlockRecurrence;
  notes?: string | null;
};

export async function insertAgendaBlock(
  db: Db,
  input: InsertAgendaBlockInput,
): Promise<{ ok: true; id: string } | { error: string; code?: string }> {
  const anchorDateKey = input.anchorDateKey.trim();
  const timeLocal = input.timeLocal.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(anchorDateKey)) {
    return { error: "Fecha inválida.", code: "INVALID_DATE" };
  }
  if (!/^\d{2}:\d{2}$/.test(timeLocal)) {
    return { error: "Horario inválido.", code: "INVALID_TIME" };
  }
  const dm = input.durationMinutes;
  if (!Number.isFinite(dm) || dm < 15 || dm > 12 * 60) {
    return { error: "Duración inválida (entre 15 min y 12 h).", code: "INVALID_DURATION" };
  }

  let recurrence: AgendaBlockRecurrence = null;
  if (input.recurrence && input.recurrence.type === "weekly") {
    const until = input.recurrence.untilDateKey?.trim();
    if (until && (!/^\d{4}-\d{2}-\d{2}$/.test(until) || until < anchorDateKey)) {
      return { error: "Fecha de fin de recurrencia inválida.", code: "INVALID_UNTIL" };
    }
    recurrence = { type: "weekly", untilDateKey: until || null };
  }

  const anchorDt = parseDateKeyLocal(anchorDateKey);
  if (!anchorDt) return { error: "Fecha inválida.", code: "INVALID_DATE" };

  const startsAt = new Date(`${anchorDateKey}T${timeLocal}:00-03:00`);
  if (Number.isNaN(startsAt.getTime())) {
    return { error: "Fecha u horario inválidos.", code: "INVALID_SLOT" };
  }

  await ensureAgendaBlockIndexes(db);

  const doc = {
    anchorDateKey,
    anchorWeekday: anchorDt.getDay(),
    timeLocal,
    durationMinutes: Math.round(dm),
    startsAt,
    displayDate: formatSalonDisplayDate(anchorDateKey),
    scope: "salon" as AgendaBlockScope,
    recurrence,
    notes: input.notes?.trim() ? String(input.notes).trim().slice(0, 500) : null,
    createdAt: new Date(),
  } satisfies Omit<SalonAgendaBlockDoc, "_id">;

  const r = await db.collection(AGENDA_BLOCKS_COLLECTION).insertOne(doc);
  return { ok: true, id: r.insertedId.toHexString() };
}

export async function deleteAgendaBlockByHexId(db: Db, hexId: string): Promise<boolean> {
  try {
    const _id = new ObjectIdCtor(hexId);
    const r = await db.collection(AGENDA_BLOCKS_COLLECTION).deleteOne({ _id });
    return r.deletedCount === 1;
  } catch {
    return false;
  }
}
