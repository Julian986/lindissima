import { NextResponse } from "next/server";
import { cronUnauthorizedResponse } from "@/lib/cron/verify-secret";
import { getDb } from "@/lib/mongodb";
import { getReminderProvider, isWhatsAppReminderConfigured } from "@/lib/whatsapp/config";
import { runWhatsAppReminder24hJob } from "@/lib/whatsapp/run-reminders";

export const dynamic = "force-dynamic";

function notConfiguredMessage(): string {
  const p = getReminderProvider();
  if (p === "twilio") {
    return (
      "Twilio no configurado: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, " +
      "TWILIO_REMINDER_CONTENT_SID (y WHATSAPP_PROVIDER=twilio si usás ambos proveedores)."
    );
  }
  return (
    "Meta no configurado: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, " +
    "WHATSAPP_TEMPLATE_NAME, WHATSAPP_TEMPLATE_LANG."
  );
}

async function run(request: Request) {
  const denied = cronUnauthorizedResponse(request);
  if (denied) return denied;

  if (!isWhatsAppReminderConfigured()) {
    return NextResponse.json({ error: notConfiguredMessage() }, { status: 503 });
  }

  try {
    const db = await getDb();
    const result = await runWhatsAppReminder24hJob(db);
    return NextResponse.json({ ...result, provider: getReminderProvider() });
  } catch (e) {
    console.error("[cron/whatsapp-reminder]", e);
    return NextResponse.json({ error: "Fallo al procesar recordatorios WhatsApp." }, { status: 500 });
  }
}

/** Vercel Cron invoca GET con Authorization: Bearer CRON_SECRET */
export async function GET(request: Request) {
  return run(request);
}

/** Pruebas manuales (curl, Postman) */
export async function POST(request: Request) {
  return run(request);
}
