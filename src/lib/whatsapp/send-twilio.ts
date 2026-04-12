import type { ReservationDoc } from "@/lib/reservations/types";
import { getTwilioReminderConfig } from "./config";
import type { SendTemplateResult } from "./send-template";

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

type TwilioMessageResponse = {
  sid?: string;
  status?: string;
  error_code?: number | string;
  message?: string;
  more_info?: string;
};

/**
 * Variables para plantilla Twilio Content (WhatsApp).
 * En Twilio Console el contenido debe declarar {{1}}, {{2}}, {{3}}, {{4}} en ese orden
 * (misma semántica que Meta: nombre, tratamiento, fecha, hora).
 */
function contentVariablesForReservation(r: ReservationDoc): Record<string, string> {
  const fifth = process.env.TWILIO_TEMPLATE_BODY_PARAM_5?.trim();
  const vars: Record<string, string> = {
    "1": truncate(r.customerName.trim() || "Cliente", 80),
    "2": truncate(r.treatmentName.trim(), 120),
    "3": truncate(r.displayDate.trim(), 80),
    "4": truncate(r.timeLocal.trim(), 16),
  };
  if (fifth) {
    vars["5"] = truncate(fifth, 120);
  }
  return vars;
}

function normalizeFrom(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("whatsapp:")) return t;
  if (t.startsWith("+")) return `whatsapp:${t}`;
  return `whatsapp:+${t.replace(/^\+/, "")}`;
}

export async function sendReminder24hTwilio(
  toWhatsapp: string,
  reservation: ReservationDoc,
): Promise<SendTemplateResult> {
  const cfg = getTwilioReminderConfig();
  const from = normalizeFrom(cfg.whatsappFrom);
  const auth = Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString("base64");
  const body = new URLSearchParams();
  body.set("From", from);
  body.set("To", toWhatsapp);
  body.set("ContentSid", cfg.contentSid);
  body.set("ContentVariables", JSON.stringify(contentVariablesForReservation(reservation)));

  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(cfg.accountSid)}/Messages.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const text = await res.text();
  let parsed: TwilioMessageResponse | null = null;
  try {
    parsed = JSON.parse(text) as TwilioMessageResponse;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const msg =
      parsed?.message ??
      (parsed?.more_info ? String(parsed.more_info) : null) ??
      (text ? truncate(text, 400) : `HTTP ${res.status}`);
    return { ok: false, httpStatus: res.status, error: msg, rawBody: truncate(text, 4000) };
  }

  const sid = parsed?.sid;
  if (!sid) {
    return {
      ok: false,
      httpStatus: res.status,
      error: "Respuesta Twilio sin sid",
      rawBody: truncate(text, 4000),
    };
  }

  return { ok: true, messageId: sid, httpStatus: res.status, rawBody: truncate(text, 4000) };
}
