import type { Db, ObjectId } from "mongodb";
import {
  findReservationByHexId,
  insertMpWebhookEvent,
  tryConfirmReservationFromMpPayment,
  updateMpWebhookEvent,
} from "@/lib/reservations/service";
import { fetchMercadoPagoPayment } from "./get-payment";

function queryRecordFromUrl(url: string): Record<string, string> {
  const u = new URL(url);
  const o: Record<string, string> = {};
  u.searchParams.forEach((v, k) => {
    o[k] = v;
  });
  return o;
}

function extractPaymentResource(
  url: string,
  body: unknown,
): { topic: string | null; paymentId: string | null } {
  const u = new URL(url);
  const q = (k: string) => u.searchParams.get(k);
  let topic = q("topic") ?? q("type");
  let paymentId = q("id");

  if (body && typeof body === "object" && body !== null) {
    const b = body as Record<string, unknown>;
    if (b.data && typeof b.data === "object" && b.data !== null && "id" in b.data) {
      paymentId = paymentId ?? String((b.data as { id: unknown }).id);
    }
    if (b.type === "payment") {
      topic = topic ?? "payment";
    }
    if (typeof b.action === "string" && b.action.startsWith("payment")) {
      topic = topic ?? "payment";
    }
  }

  return { topic, paymentId };
}

/**
 * Procesa una notificación de Mercado Pago (IPN / webhook).
 * Debe llamarse después de persistir el evento en auditoría (o integrado aquí).
 */
export async function processMercadoPagoNotification(
  db: Db,
  opts: {
    logId: ObjectId;
    method: string;
    requestUrl: string;
    bodySnapshot: unknown;
  },
): Promise<void> {
  const querySnapshot = queryRecordFromUrl(opts.requestUrl);
  const { topic, paymentId } = extractPaymentResource(opts.requestUrl, opts.bodySnapshot);

  if (!paymentId) {
    await updateMpWebhookEvent(db, opts.logId, {
      processingOutcome: "ignored",
      detail: "missing_payment_id",
    });
    return;
  }

  if (topic && topic !== "payment") {
    await updateMpWebhookEvent(db, opts.logId, {
      processingOutcome: "ignored",
      detail: `topic_${topic}`,
      mpPaymentId: paymentId,
    });
    return;
  }

  /* topic ausente o "payment": seguimos (IPN clásico suele mandar topic=payment&id=...) */

  const fetched = await fetchMercadoPagoPayment(paymentId);
  if (!fetched.ok) {
    await updateMpWebhookEvent(db, opts.logId, {
      processingOutcome: "error",
      detail: fetched.error,
      mpPaymentId: paymentId,
    });
    return;
  }

  const ext = fetched.payment.external_reference?.trim() ?? "";
  const reservation = ext ? await findReservationByHexId(db, ext) : null;

  const confirm = await tryConfirmReservationFromMpPayment(db, fetched.payment);

  await updateMpWebhookEvent(db, opts.logId, {
    processingOutcome: "processed",
    detail: `${confirm.outcome}${confirm.detail ? `:${confirm.detail}` : ""}`,
    reservationHexId: reservation?._id.toHexString() ?? (ext || null),
    mpPaymentId: paymentId,
  });
}

export async function logAndProcessMercadoPagoRequest(
  db: Db,
  method: string,
  requestUrl: string,
  bodySnapshot: unknown,
): Promise<void> {
  const querySnapshot = queryRecordFromUrl(requestUrl);
  const { topic, paymentId } = extractPaymentResource(requestUrl, bodySnapshot);

  const logId = await insertMpWebhookEvent(db, {
    receivedAt: new Date(),
    method,
    topic,
    resourceId: paymentId,
    querySnapshot,
    bodySnapshot,
    processingOutcome: "ignored",
    detail: "received",
  });

  await processMercadoPagoNotification(db, {
    logId,
    method,
    requestUrl,
    bodySnapshot,
  });
}
