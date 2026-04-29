import type { Db } from "mongodb";

import { canonicalPhoneDigitsAR, customerPhoneDigitsQueryValues } from "@/lib/customer/phone-canonical-ar";

import type { ReservationDoc } from "./types";

const COLLECTION = "reservations";

/**
 * Reservas del cliente. Busca por customerPhoneDigits normalizado (registros nuevos)
 * y también por fallback en los últimos 8 dígitos del customerPhone (registros viejos
 * creados antes de que se guardara customerPhoneDigits).
 */
export async function listReservationsByCustomerPhoneDigits(
  db: Db,
  phoneDigitsCanonical: string,
): Promise<ReservationDoc[]> {
  const keys = customerPhoneDigitsQueryValues(phoneDigitsCanonical);
  const last8 = phoneDigitsCanonical.slice(-8);
  return db
    .collection<ReservationDoc>(COLLECTION)
    .find({
      $or: [
        { customerPhoneDigits: { $in: keys } },
        { customerPhone: { $regex: last8 } },
      ],
    })
    .sort({ startsAt: -1 })
    .limit(200)
    .toArray();
}

/** Rellena `customerPhoneDigits` en documentos sin el campo (tandas acotadas). */
export async function backfillCustomerPhoneDigitsBatch(db: Db, batchSize = 250): Promise<number> {
  const col = db.collection<ReservationDoc>(COLLECTION);
  const rows = await col
    .find({ customerPhoneDigits: { $exists: false } }, { projection: { _id: 1, customerPhone: 1 } })
    .limit(batchSize)
    .toArray();
  if (rows.length === 0) return 0;
  await Promise.all(
    rows.map((r) =>
      col.updateOne(
        { _id: r._id },
        { $set: { customerPhoneDigits: canonicalPhoneDigitsAR(String(r.customerPhone ?? "")) } },
      ),
    ),
  );
  return rows.length;
}
