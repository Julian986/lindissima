import type { Db } from "mongodb";
import type { ReservationDoc } from "./types";

const COLLECTION = "reservations";

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
