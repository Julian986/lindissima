import { randomBytes } from "crypto";
import type { Db, ObjectId } from "mongodb";
import { MongoServerError, ObjectId as ObjectIdCtor } from "mongodb";
import { canonicalPhoneDigitsAR, customerPhoneDigitsQueryValues } from "@/lib/customer/phone-canonical-ar";
import { getScheduleTimesForDate, formatSalonDisplayDate } from "@/lib/booking/salon-schedule";
import { isPublicLeadTimeViolated, isPastSlotForPublic } from "@/lib/booking/public-slot-lead";
import type {
  CreateReservationInput,
  MpWebhookEventDoc,
  ReservationDoc,
  ReservationStatus,
  WaMessageEventDoc,
} from "./types";

const RESCHEDULEABLE_STATUSES: ReservationStatus[] = ["confirmed", "pending_payment"];
const CANCELLABLE_STATUSES: ReservationStatus[] = ["confirmed", "pending_payment"];

const COLLECTION = "reservations";
const WEBHOOK_LOGS = "mp_webhook_events";
const WA_MESSAGE_LOGS = "wa_message_events";

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

function pendingTtlMs(): number {
  const raw = process.env.PENDING_RESERVATION_TTL_MINUTES;
  const n = raw ? Number(raw) : 60;
  if (!Number.isFinite(n) || n < 5 || n > 10080) return 60 * 60 * 1000;
  return n * 60 * 1000;
}

let indexesEnsured = false;

export async function ensureReservationIndexes(db: Db) {
  if (indexesEnsured) return;
  const col = db.collection(COLLECTION);
  const logs = db.collection(WEBHOOK_LOGS);
  const waLogs = db.collection(WA_MESSAGE_LOGS);

  try {
    await col.dropIndex("uniq_startsAt");
  } catch {
    /* no existe en deploys nuevos */
  }

  await col.createIndex(
    { startsAt: 1 },
    {
      unique: true,
      partialFilterExpression: {
        reservationStatus: { $in: ["pending_payment", "confirmed"] },
      },
      name: "uniq_startsAt_active_pending_or_confirmed",
    },
  );
  await col.createIndex({ createdAt: -1 }, { name: "by_created" });
  await col.createIndex({ reservationStatus: 1, startsAt: 1 }, { name: "by_status_starts" });
  await col.createIndex({ externalReference: 1 }, { sparse: true, name: "by_external_ref" });
  await col.createIndex({ paymentDeadlineAt: 1 }, { sparse: true, name: "by_payment_deadline" });
  await col.createIndex(
    { reservationStatus: 1, whatsappOptIn: 1, startsAt: 1 },
    { name: "by_reminder_scan" },
  );

  await logs.createIndex({ receivedAt: -1 }, { name: "mp_logs_received" });
  await logs.createIndex({ resourceId: 1, receivedAt: -1 }, { name: "mp_logs_resource" });

  await waLogs.createIndex({ sentAt: -1 }, { name: "wa_logs_sent" });
  await waLogs.createIndex({ reservationId: 1, sentAt: -1 }, { name: "wa_logs_reservation" });

  indexesEnsured = true;
}

export async function insertPendingReservation(
  db: Db,
  input: CreateReservationInput,
): Promise<
  | { id: string; checkoutToken: string; externalReference: string }
  | { error: string; code?: string }
> {
  const isPanel = input.source === "panel";

  if (!isPanel && isPublicLeadTimeViolated(input.dateKey)) {
    return {
      error: "No podés reservar en una fecha pasada.",
      code: "LEAD_TIME_VIOLATION",
    };
  }

  if (!isPanel && isPastSlotForPublic(input.dateKey, input.timeLocal)) {
    return {
      error: "Este horario ya pasó. Elegí uno más adelante.",
      code: "SLOT_IN_PAST",
    };
  }

  const startsAt = computeStartsAtUtc(input.dateKey, input.timeLocal);
  if (!startsAt) {
    return { error: "Fecha u horario inválidos.", code: "INVALID_SLOT" };
  }

  const now = new Date();
  const checkoutToken = randomBytes(32).toString("hex");
  const paymentDeadlineAt = new Date(now.getTime() + pendingTtlMs());

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
    customerPhoneDigits: canonicalPhoneDigitsAR(input.customerPhone),
    whatsappOptIn: input.whatsappOptIn,
    reservationStatus: "pending_payment" as ReservationStatus,
    paymentStatus: "pending" as const,
    source: "app_turnos" as const,
    createdAt: now,
    updatedAt: now,
    checkoutToken,
    paymentDeadlineAt,
  } satisfies Omit<ReservationDoc, "_id" | "externalReference" | "preferenceId" | "mpPaymentId">;

  await ensureReservationIndexes(db);

  try {
    const result = await db.collection(COLLECTION).insertOne(doc);
    const id = result.insertedId.toHexString();
    await db.collection(COLLECTION).updateOne(
      { _id: result.insertedId },
      { $set: { externalReference: id, updatedAt: new Date() } },
    );
    return { id, checkoutToken, externalReference: id };
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) {
      return {
        error: "Ese horario ya está ocupado o tiene una reserva pendiente. Elegí otro día u horario.",
        code: "SLOT_TAKEN",
      };
    }
    throw e;
  }
}

export async function findReservationByHexId(db: Db, hexId: string): Promise<ReservationDoc | null> {
  try {
    const _id = new ObjectIdCtor(hexId);
    const doc = await db.collection<ReservationDoc>(COLLECTION).findOne({ _id });
    return doc ?? null;
  } catch {
    return null;
  }
}

export async function attachPreferenceToReservation(
  db: Db,
  reservationId: ObjectId,
  preferenceId: string,
): Promise<boolean> {
  const r = await db.collection(COLLECTION).updateOne(
    { _id: reservationId, reservationStatus: "pending_payment" },
    { $set: { preferenceId, updatedAt: new Date() } },
  );
  return r.modifiedCount === 1;
}

/** Confirma sin cobro online (misma validación de token y vencimiento que Checkout Pro). */
export async function confirmReservationWithoutPayment(
  db: Db,
  hexId: string,
  checkoutToken: string,
): Promise<{ ok: true } | { ok: false; error: string; code?: string }> {
  const reservation = await findReservationByHexId(db, hexId);
  if (!reservation) {
    return { ok: false, error: "Reserva no encontrada.", code: "NOT_FOUND" };
  }
  if (reservation.reservationStatus !== "pending_payment") {
    return { ok: false, error: "La reserva no admite confirmación en este estado.", code: "STATE" };
  }
  if (reservation.checkoutToken !== checkoutToken) {
    return { ok: false, error: "Token de checkout inválido.", code: "TOKEN" };
  }
  if (reservation.paymentDeadlineAt && reservation.paymentDeadlineAt.getTime() < Date.now()) {
    return { ok: false, error: "La reserva expiró. Creá una nueva reserva.", code: "EXPIRED" };
  }

  const now = new Date();
  const result = await db.collection(COLLECTION).updateOne(
    { _id: reservation._id, reservationStatus: "pending_payment" },
    {
      $set: {
        reservationStatus: "confirmed",
        paymentStatus: "not_required",
        updatedAt: now,
      },
      $unset: { checkoutToken: "", paymentDeadlineAt: "" },
    },
  );

  if (result.modifiedCount !== 1) {
    return { ok: false, error: "No se pudo confirmar la reserva.", code: "CONFLICT" };
  }
  return { ok: true };
}

export type MpPaymentPayload = {
  id: number | string;
  status: string;
  external_reference?: string | null;
};

/**
 * Confirma la reserva si el pago está approved y el external_reference coincide.
 * Idempotente: si ya está confirmed con el mismo mpPaymentId, no hace nada destructivo.
 */
export async function tryConfirmReservationFromMpPayment(
  db: Db,
  payment: MpPaymentPayload,
): Promise<{ outcome: "confirmed" | "ignored" | "no_match" | "not_approved"; detail?: string }> {
  const paymentIdStr = String(payment.id);
  const ext = payment.external_reference?.trim() ?? "";

  if (payment.status !== "approved") {
    if (ext) {
      const res = await findReservationByHexId(db, ext);
      if (res && res.reservationStatus === "pending_payment") {
        await db.collection(COLLECTION).updateOne(
          { _id: res._id },
          {
            $set: {
              mpPaymentId: paymentIdStr,
              mpPaymentStatusLast: payment.status,
              updatedAt: new Date(),
            },
          },
        );
      }
    }
    return { outcome: "not_approved", detail: payment.status };
  }

  if (!ext) {
    return { outcome: "no_match", detail: "missing_external_reference" };
  }

  const reservation = await findReservationByHexId(db, ext);
  if (!reservation) {
    return { outcome: "no_match", detail: "reservation_not_found" };
  }

  if (reservation.reservationStatus === "confirmed") {
    if (reservation.mpPaymentId === paymentIdStr) {
      return { outcome: "ignored", detail: "already_confirmed_same_payment" };
    }
    return { outcome: "ignored", detail: "already_confirmed_different_payment" };
  }

  if (reservation.reservationStatus !== "pending_payment") {
    return { outcome: "ignored", detail: `reservation_status_${reservation.reservationStatus}` };
  }

  if (reservation.paymentDeadlineAt && reservation.paymentDeadlineAt.getTime() < Date.now()) {
    return { outcome: "ignored", detail: "reservation_expired" };
  }

  const now = new Date();
  const result = await db.collection(COLLECTION).updateOne(
    {
      _id: reservation._id,
      reservationStatus: "pending_payment",
    },
    {
      $set: {
        reservationStatus: "confirmed",
        paymentStatus: "approved",
        mpPaymentId: paymentIdStr,
        mpPaymentStatusLast: payment.status,
        mpPaymentApprovedAt: now,
        updatedAt: now,
      },
      $unset: { checkoutToken: "" },
    },
  );

  if (result.modifiedCount !== 1) {
    return { outcome: "ignored", detail: "concurrent_update" };
  }

  return { outcome: "confirmed" };
}

export async function insertMpWebhookEvent(db: Db, doc: MpWebhookEventDoc): Promise<ObjectId> {
  const r = await db.collection<MpWebhookEventDoc>(WEBHOOK_LOGS).insertOne(doc);
  return r.insertedId;
}

export async function updateMpWebhookEvent(
  db: Db,
  id: ObjectId,
  patch: Partial<Pick<MpWebhookEventDoc, "processingOutcome" | "detail" | "reservationHexId" | "mpPaymentId">>,
) {
  await db.collection(WEBHOOK_LOGS).updateOne({ _id: id }, { $set: patch });
}

/** Marca reservas pending_payment vencidas como canceladas (libera el slot para nuevo pending). */
export async function insertWaMessageEvent(db: Db, doc: WaMessageEventDoc): Promise<ObjectId> {
  const r = await db.collection<WaMessageEventDoc>(WA_MESSAGE_LOGS).insertOne(doc);
  return r.insertedId;
}

/**
 * Marca recordatorio 24h como enviado solo si aún no había waReminder24hSentAt (idempotente).
 */
export async function tryMarkReminder24hSent(
  db: Db,
  reservationId: ObjectId,
  messageId: string,
): Promise<boolean> {
  const now = new Date();
  const r = await db.collection(COLLECTION).updateOne(
    {
      _id: reservationId,
      reservationStatus: "confirmed",
      whatsappOptIn: true,
      $or: [{ waReminder24hSentAt: { $exists: false } }, { waReminder24hSentAt: null }],
    },
    {
      $set: {
        waReminder24hStatus: "sent",
        waReminder24hSentAt: now,
        waReminder24hMessageId: messageId,
        waReminder24hLastError: null,
        updatedAt: now,
      },
    },
  );
  return r.modifiedCount === 1;
}

export async function tryMarkReminder24hFailed(
  db: Db,
  reservationId: ObjectId,
  errorMessage: string,
): Promise<void> {
  const now = new Date();
  const truncated = errorMessage.slice(0, 500);
  await db.collection(COLLECTION).updateOne(
    {
      _id: reservationId,
      reservationStatus: "confirmed",
      $or: [{ waReminder24hSentAt: { $exists: false } }, { waReminder24hSentAt: null }],
    },
    {
      $set: {
        waReminder24hStatus: "failed",
        waReminder24hLastError: truncated,
        updatedAt: now,
      },
    },
  );
}

/** Teléfono inválido u opt-out implícito: no reintentar envío automático. */
export async function tryMarkReminder24hSkipped(
  db: Db,
  reservationId: ObjectId,
  reason: string,
): Promise<void> {
  const now = new Date();
  await db.collection(COLLECTION).updateOne(
    {
      _id: reservationId,
      reservationStatus: "confirmed",
      $or: [{ waReminder24hSentAt: { $exists: false } }, { waReminder24hSentAt: null }],
    },
    {
      $set: {
        waReminder24hStatus: "skipped",
        waReminder24hLastError: reason.slice(0, 500),
        updatedAt: now,
      },
    },
  );
}

/**
 * Reprograma una reserva activa del cliente o del panel.
 * Para reservas de app_turnos (cliente web) aplica la regla de 2 días de anticipación.
 * Verifica que el slot esté en la grilla del salón y que no esté ya ocupado.
 */
export async function rescheduleReservation(
  db: Db,
  input: {
    reservationHexId: string;
    newDateKey: string;
    newTimeLocal: string;
    now: Date;
    actor: "panel" | "customer";
    customerCanonicalDigits?: string | null;
  },
): Promise<{ ok: true } | { error: string; code?: string }> {
  await ensureReservationIndexes(db);
  const hex = input.reservationHexId.trim();
  const doc = await findReservationByHexId(db, hex);
  if (!doc) return { error: "Turno no encontrado.", code: "NOT_FOUND" };
  if (!RESCHEDULEABLE_STATUSES.includes(doc.reservationStatus)) {
    return { error: "Este turno no se puede reprogramar (cancelado o finalizado).", code: "NOT_MOVABLE" };
  }

  if (input.actor === "customer") {
    const canon = input.customerCanonicalDigits?.trim();
    if (!canon) return { error: "Tenés que iniciar sesión en tu perfil.", code: "UNAUTHORIZED" };
    const docDigits = doc.customerPhoneDigits ?? canonicalPhoneDigitsAR(doc.customerPhone);
    if (!customerPhoneDigitsQueryValues(canon).includes(docDigits)) {
      return { error: "No podés modificar un turno de otro cliente.", code: "FORBIDDEN" };
    }
  }

  const newKey = input.newDateKey.trim();
  const newTime = input.newTimeLocal.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newKey) || !/^\d{2}:\d{2}$/.test(newTime)) {
    return { error: "Fecha u horario inválidos.", code: "INVALID_SLOT" };
  }
  if (doc.dateKey === newKey && doc.timeLocal === newTime) {
    return { error: "Elegí un día u horario distinto al actual.", code: "NO_CHANGE" };
  }

  const startsAt = computeStartsAtUtc(newKey, newTime);
  if (!startsAt) return { error: "Fecha u horario inválidos.", code: "INVALID_SLOT" };

  // Anticipación mínima solo para reservas originadas desde la web pública
  if (input.actor === "customer" && doc.source === "app_turnos") {
    if (isPublicLeadTimeViolated(newKey, input.now)) {
      return {
        error: "Los turnos web se pueden reservar con al menos 2 días de anticipación.",
        code: "LEAD_TIME",
      };
    }
  }

  // El horario tiene que estar en la grilla del salón para ese día
  const grillaTimes = getScheduleTimesForDate(newKey);
  if (!grillaTimes.includes(newTime)) {
    return { error: "Ese horario no está en la grilla del salón para ese día.", code: "SLOT_UNAVAILABLE" };
  }

  // No debe haber otra reserva activa en ese slot (excluyendo la actual)
  let excludeOid: ObjectId;
  try {
    excludeOid = new ObjectIdCtor(hex);
  } catch {
    return { error: "Turno no encontrado.", code: "NOT_FOUND" };
  }
  const collision = await db.collection<ReservationDoc>(COLLECTION).findOne({
    _id: { $ne: excludeOid },
    dateKey: newKey,
    timeLocal: newTime,
    reservationStatus: { $in: ["pending_payment", "confirmed"] },
  });
  if (collision) {
    return { error: "Ese horario ya está ocupado. Elegí otro.", code: "SLOT_UNAVAILABLE" };
  }

  const result = await db.collection<ReservationDoc>(COLLECTION).updateOne(
    { _id: doc._id, reservationStatus: doc.reservationStatus },
    {
      $set: {
        dateKey: newKey,
        timeLocal: newTime,
        startsAt,
        displayDate: formatSalonDisplayDate(newKey),
        updatedAt: new Date(),
      },
      $unset: { waReminder24hSentAt: "" },
    },
  );
  if (result.modifiedCount !== 1) {
    return { error: "No se pudo actualizar el turno. Probá de nuevo.", code: "CONFLICT" };
  }
  return { ok: true as const };
}

/**
 * Cancela una reserva activa.
 * Cliente: solo su propio WhatsApp; panel: cualquier turno cancelable.
 */
export async function cancelReservation(
  db: Db,
  input: {
    reservationHexId: string;
    now: Date;
    actor: "panel" | "customer";
    customerCanonicalDigits?: string | null;
    cancelReason?: string | null;
  },
): Promise<{ ok: true } | { error: string; code?: string }> {
  await ensureReservationIndexes(db);
  const hex = input.reservationHexId.trim();
  const doc = await findReservationByHexId(db, hex);
  if (!doc) return { error: "Turno no encontrado.", code: "NOT_FOUND" };
  if (!CANCELLABLE_STATUSES.includes(doc.reservationStatus)) {
    return { error: "Este turno no se puede cancelar.", code: "NOT_CANCELLABLE" };
  }

  if (input.actor === "customer") {
    const canon = input.customerCanonicalDigits?.trim();
    if (!canon) return { error: "Tenés que iniciar sesión en tu perfil.", code: "UNAUTHORIZED" };
    const docDigits = doc.customerPhoneDigits ?? canonicalPhoneDigitsAR(doc.customerPhone);
    if (!customerPhoneDigitsQueryValues(canon).includes(docDigits)) {
      return { error: "No podés modificar un turno de otro cliente.", code: "FORBIDDEN" };
    }
  }

  const reason = String(input.cancelReason ?? "").trim().slice(0, 160) || undefined;
  const result = await db.collection<ReservationDoc>(COLLECTION).updateOne(
    { _id: doc._id, reservationStatus: doc.reservationStatus },
    {
      $set: {
        reservationStatus: "cancelled",
        cancelledBy: input.actor,
        ...(reason ? { cancelReason: reason } : {}),
        updatedAt: input.now,
      },
      $unset: { waReminder24hSentAt: "" },
    },
  );
  if (result.modifiedCount !== 1) {
    return { error: "No se pudo cancelar el turno. Probá de nuevo.", code: "CONFLICT" };
  }
  return { ok: true as const };
}

export async function expirePendingReservations(db: Db): Promise<number> {
  const now = new Date();
  const r = await db.collection(COLLECTION).updateMany(
    {
      reservationStatus: "pending_payment",
      paymentDeadlineAt: { $lt: now },
    },
    {
      $set: {
        reservationStatus: "cancelled",
        paymentStatus: "failed",
        cancelReason: "payment_deadline_expired",
        updatedAt: now,
      },
      $unset: { checkoutToken: "" },
    },
  );
  return r.modifiedCount;
}
