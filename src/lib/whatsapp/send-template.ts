import type { ReservationDoc } from "@/lib/reservations/types";
import { getWhatsAppCloudConfig } from "./config";

type GraphSendResponse = {
  messages?: { id?: string }[];
  error?: { message?: string; type?: string; code?: number };
};

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

/**
 * Arma parámetros del cuerpo de plantilla en orden fijo.
 * La plantilla en Meta debe declarar {{1}}, {{2}}, {{3}}, {{4}} en el body (o el mismo orden en editor).
 * 1: nombre, 2: tratamiento, 3: fecha mostrada, 4: hora local.
 */
function bodyParametersForReservation(r: ReservationDoc): { type: "text"; text: string }[] {
  const fifth = process.env.WHATSAPP_TEMPLATE_BODY_PARAM_5?.trim();
  const base = [
    { type: "text" as const, text: truncate(r.customerName.trim() || "Cliente", 80) },
    { type: "text" as const, text: truncate(r.treatmentName.trim(), 120) },
    { type: "text" as const, text: truncate(r.displayDate.trim(), 80) },
    { type: "text" as const, text: truncate(r.timeLocal.trim(), 16) },
  ];
  if (fifth) {
    base.push({ type: "text" as const, text: truncate(fifth, 120) });
  }
  return base;
}

export type SendTemplateResult =
  | { ok: true; messageId: string; httpStatus: number; rawBody: string }
  | { ok: false; httpStatus: number; error: string; rawBody: string };

export async function sendReminder24hTemplate(
  toDigits: string,
  reservation: ReservationDoc,
): Promise<SendTemplateResult> {
  const cfg = getWhatsAppCloudConfig();
  const url = `https://graph.facebook.com/${cfg.graphVersion}/${cfg.phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toDigits,
    type: "template",
    template: {
      name: cfg.templateName,
      language: { code: cfg.templateLang },
      components: [
        {
          type: "body",
          parameters: bodyParametersForReservation(reservation),
        },
      ],
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let parsed: GraphSendResponse | null = null;
  try {
    parsed = JSON.parse(text) as GraphSendResponse;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const msg =
      parsed?.error?.message ??
      (text ? truncate(text, 400) : `HTTP ${res.status}`);
    return { ok: false, httpStatus: res.status, error: msg, rawBody: truncate(text, 4000) };
  }

  const messageId = parsed?.messages?.[0]?.id;
  if (!messageId) {
    return {
      ok: false,
      httpStatus: res.status,
      error: "Respuesta Graph sin messages[0].id",
      rawBody: truncate(text, 4000),
    };
  }

  return { ok: true, messageId, httpStatus: res.status, rawBody: truncate(text, 4000) };
}
