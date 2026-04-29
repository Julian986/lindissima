function parsePositiveInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Máx. 1440 (24 h) para cron diario (Vercel Hobby) con ventana ancha. */
export function getWhatsAppReminderWindowMinutes(): number {
  return parsePositiveInt(process.env.WHATSAPP_REMINDER_WINDOW_MINUTES, 15, 1, 1440);
}

export function getWhatsAppGraphApiVersion(): string {
  const v = (process.env.WHATSAPP_GRAPH_API_VERSION ?? "v21.0").trim();
  return v || "v21.0";
}

export type WhatsAppCloudConfig = {
  accessToken: string;
  phoneNumberId: string;
  templateName: string;
  templateLang: string;
  graphVersion: string;
};

export type TwilioReminderConfig = {
  accountSid: string;
  authToken: string;
  whatsappFrom: string;
  contentSid: string;
};

export function isMetaWhatsAppReminderConfigured(): boolean {
  const t = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const name = process.env.WHATSAPP_TEMPLATE_NAME?.trim();
  const lang = process.env.WHATSAPP_TEMPLATE_LANG?.trim();
  return Boolean(t && id && name && lang);
}

export function isTwilioReminderConfigured(): boolean {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim();
  const content = process.env.TWILIO_REMINDER_CONTENT_SID?.trim();
  return Boolean(sid && token && from && content);
}

/**
 * `twilio` | `meta` explícito con WHATSAPP_PROVIDER, o auto: Twilio si está completo, si no Meta.
 */
export function getReminderProvider(): "twilio" | "meta" {
  const explicit = process.env.WHATSAPP_PROVIDER?.trim().toLowerCase();
  if (explicit === "twilio" || explicit === "meta") {
    return explicit;
  }
  if (isTwilioReminderConfigured()) return "twilio";
  return "meta";
}

/** True si el proveedor activo tiene todas las variables necesarias. */
export function isWhatsAppReminderConfigured(): boolean {
  return getReminderProvider() === "twilio"
    ? isTwilioReminderConfigured()
    : isMetaWhatsAppReminderConfigured();
}

export function getWhatsAppCloudConfig(): WhatsAppCloudConfig {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim();
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG?.trim();
  if (!accessToken) throw new Error("WHATSAPP_ACCESS_TOKEN no está definida");
  if (!phoneNumberId) throw new Error("WHATSAPP_PHONE_NUMBER_ID no está definida");
  if (!templateName) throw new Error("WHATSAPP_TEMPLATE_NAME no está definida");
  if (!templateLang) throw new Error("WHATSAPP_TEMPLATE_LANG no está definida");
  return {
    accessToken,
    phoneNumberId,
    templateName,
    templateLang,
    graphVersion: getWhatsAppGraphApiVersion(),
  };
}

export function getTwilioReminderConfig(): TwilioReminderConfig {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM?.trim();
  // LINDISSIMA - SID a actualizar cuando apruebe Meta
  const contentSid = process.env.TWILIO_REMINDER_CONTENT_SID?.trim();
  if (!accountSid) throw new Error("TWILIO_ACCOUNT_SID no está definida");
  if (!authToken) throw new Error("TWILIO_AUTH_TOKEN no está definida");
  if (!whatsappFrom) throw new Error("TWILIO_WHATSAPP_FROM no está definida");
  if (!contentSid) throw new Error("TWILIO_REMINDER_CONTENT_SID no está definida");
  return { accountSid, authToken, whatsappFrom, contentSid };
}
