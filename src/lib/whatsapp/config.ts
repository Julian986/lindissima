function parsePositiveInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function getWhatsAppReminderWindowMinutes(): number {
  return parsePositiveInt(process.env.WHATSAPP_REMINDER_WINDOW_MINUTES, 15, 1, 120);
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

export function isWhatsAppReminderConfigured(): boolean {
  const t = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const name = process.env.WHATSAPP_TEMPLATE_NAME?.trim();
  const lang = process.env.WHATSAPP_TEMPLATE_LANG?.trim();
  return Boolean(t && id && name && lang);
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
