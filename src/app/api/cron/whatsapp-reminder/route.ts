import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isWhatsAppReminderConfigured } from "@/lib/whatsapp/config";
import { runWhatsAppReminder24hJob } from "@/lib/whatsapp/run-reminders";

export const dynamic = "force-dynamic";

/**
 * Recordatorio WhatsApp ~24h antes del turno. Protegé con CRON_SECRET en Authorization: Bearer ...
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado." }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!isWhatsAppReminderConfigured()) {
    return NextResponse.json(
      { error: "WhatsApp no configurado (WHATSAPP_ACCESS_TOKEN, PHONE_NUMBER_ID, TEMPLATE_NAME, TEMPLATE_LANG)." },
      { status: 503 },
    );
  }

  try {
    const db = await getDb();
    const result = await runWhatsAppReminder24hJob(db);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[cron/whatsapp-reminder]", e);
    return NextResponse.json({ error: "Fallo al procesar recordatorios WhatsApp." }, { status: 500 });
  }
}
