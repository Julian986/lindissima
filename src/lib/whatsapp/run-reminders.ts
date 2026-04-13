import type { Db } from "mongodb";
import { findReservationsNeedingReminderNextDayAr } from "@/lib/reservations/admin-queries";
import {
  ensureReservationIndexes,
  insertWaMessageEvent,
  tryMarkReminder24hFailed,
  tryMarkReminder24hSent,
  tryMarkReminder24hSkipped,
} from "@/lib/reservations/service";
import {
  getReminderProvider,
  isWhatsAppReminderConfigured,
} from "./config";
import { digitsToTwilioWhatsAppTo, normalizeWhatsAppToDigits } from "./phone";
import { sendReminder24hTwilio } from "./send-twilio";
import { sendReminder24hTemplate } from "./send-template";

function requestSummaryForLog(toDigits: string, reservationId: string): string {
  return `reminder_24h to=${toDigits} reservationId=${reservationId}`;
}

export type RunWhatsAppReminder24hResult = {
  ok: true;
  scannedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
};

export async function runWhatsAppReminder24hJob(db: Db): Promise<RunWhatsAppReminder24hResult> {
  if (!isWhatsAppReminderConfigured()) {
    throw new Error("Recordatorios WhatsApp no configurados (Meta o Twilio según WHATSAPP_PROVIDER).");
  }

  const provider = getReminderProvider();

  await ensureReservationIndexes(db);
  const now = new Date();
  const candidates = await findReservationsNeedingReminderNextDayAr(db, now);

  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const r of candidates) {
    const reservationId = r._id.toHexString();
    const toDigits = normalizeWhatsAppToDigits(r.customerPhone);
    if (!toDigits) {
      skippedCount += 1;
      await tryMarkReminder24hSkipped(db, r._id, "invalid_phone");
      await insertWaMessageEvent(db, {
        reservationId,
        kind: "reminder_24h",
        sentAt: new Date(),
        httpStatus: null,
        requestSummary: requestSummaryForLog("(invalid)", reservationId),
        responseBodyTruncated: null,
        error: "invalid_phone",
      });
      continue;
    }

    let send;
    if (provider === "twilio") {
      const toWa = digitsToTwilioWhatsAppTo(toDigits);
      if (!toWa) {
        skippedCount += 1;
        await tryMarkReminder24hSkipped(db, r._id, "invalid_phone_e164");
        await insertWaMessageEvent(db, {
          reservationId,
          kind: "reminder_24h",
          sentAt: new Date(),
          httpStatus: null,
          requestSummary: requestSummaryForLog("(invalid_e164)", reservationId),
          responseBodyTruncated: null,
          error: "invalid_phone_e164",
        });
        continue;
      }
      send = await sendReminder24hTwilio(toWa, r);
    } else {
      send = await sendReminder24hTemplate(toDigits, r);
    }
    if (!send.ok) {
      failedCount += 1;
      await tryMarkReminder24hFailed(db, r._id, send.error);
      await insertWaMessageEvent(db, {
        reservationId,
        kind: "reminder_24h",
        sentAt: new Date(),
        httpStatus: send.httpStatus,
        requestSummary: requestSummaryForLog(toDigits, reservationId),
        responseBodyTruncated: send.rawBody,
        error: send.error,
      });
      console.warn("[whatsapp reminder]", reservationId, send.error);
      continue;
    }

    const marked = await tryMarkReminder24hSent(db, r._id, send.messageId);
    if (marked) {
      sentCount += 1;
    }
    await insertWaMessageEvent(db, {
      reservationId,
      kind: "reminder_24h",
      sentAt: new Date(),
      httpStatus: send.httpStatus,
      requestSummary: requestSummaryForLog(toDigits, reservationId),
      responseBodyTruncated: send.rawBody,
      error: marked ? null : "concurrent_update_reservation_not_marked",
    });
  }

  return {
    ok: true,
    scannedCount: candidates.length,
    sentCount,
    failedCount,
    skippedCount,
  };
}
