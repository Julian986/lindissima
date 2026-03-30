import type { Db } from "mongodb";
import { MongoServerError } from "mongodb";
import type { CreateReservationInput, PaymentStatus, ReservationDoc, ReservationStatus } from "./types";

const COLLECTION = "reservations";

/** Argentina: sin DST desde 2009; offset fijo UTC-3 para armar el instante del turno. */
export function computeStartsAtUtc(dateKey: string, timeLocal: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !/^\d{2}:\d{2}$/.test(timeLocal)) {
    return null;
  }
  const isoLocal = `${dateKey}T${timeLocal}:00`;
  const withOffset = `${isoLocal}-03:00`;
  const d = new Date(withOffset);
  return Number.isNaN(d.getTime()) ? null : d;
}

let indexesEnsured = false;

export async function ensureReservationIndexes(db: Db) {
  if (indexesEnsured) return;
  const col = db.collection(COLLECTION);
  await col.createIndex({ startsAt: 1 }, { unique: true, name: "uniq_startsAt" });
  await col.createIndex({ createdAt: -1 }, { name: "by_created" });
  await col.createIndex({ reservationStatus: 1, startsAt: 1 }, { name: "by_status_starts" });
  indexesEnsured = true;
}

export async function insertReservation(
  db: Db,
  input: CreateReservationInput,
): Promise<{ id: string } | { error: string; code?: string }> {
  const startsAt = computeStartsAtUtc(input.dateKey, input.timeLocal);
  if (!startsAt) {
    return { error: "Fecha u horario inválidos.", code: "INVALID_SLOT" };
  }

  const now = new Date();
  const reservationStatus: ReservationStatus = "confirmed";
  const paymentStatus: PaymentStatus = "simulated_paid";

  const doc = {
    treatmentId: input.treatmentId,
    treatmentName: input.treatmentName,
    subtitle: input.subtitle,
    category: input.category,
    dateKey: input.dateKey,
    timeLocal: input.timeLocal,
    displayDate: input.displayDate,
    startsAt,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    whatsappOptIn: input.whatsappOptIn,
    reservationStatus,
    paymentStatus,
    source: "app_turnos",
    createdAt: now,
    updatedAt: now,
  } satisfies Omit<ReservationDoc, "_id">;

  await ensureReservationIndexes(db);

  try {
    const result = await db.collection(COLLECTION).insertOne(doc);
    return { id: result.insertedId.toHexString() };
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) {
      return {
        error: "Ese horario ya está ocupado. Elegí otro día u horario.",
        code: "SLOT_TAKEN",
      };
    }
    throw e;
  }
}
