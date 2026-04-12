import { NextResponse } from "next/server";
import { cronUnauthorizedResponse } from "@/lib/cron/verify-secret";
import { getDb } from "@/lib/mongodb";
import { expirePendingReservations } from "@/lib/reservations/service";
import { isWhatsAppReminderConfigured } from "@/lib/whatsapp/config";
import { runWhatsAppReminder24hJob } from "@/lib/whatsapp/run-reminders";

export const dynamic = "force-dynamic";

/**
 * Un solo job diario (plan Vercel Hobby): expira reservas pendientes de pago
 * y envía recordatorios WhatsApp ~24h antes (según ventana en env).
 */
async function run(request: Request) {
  const denied = cronUnauthorizedResponse(request);
  if (denied) return denied;

  try {
    const db = await getDb();
    const expiredCount = await expirePendingReservations(db);

    if (!isWhatsAppReminderConfigured()) {
      return NextResponse.json({
        ok: true,
        expiredCount,
        reminders: null,
        reminderNote: "WhatsApp no configurado; solo se ejecutó expiración de pendientes.",
      });
    }

    const reminders = await runWhatsAppReminder24hJob(db);
    return NextResponse.json({
      ok: true,
      expiredCount,
      reminders,
    });
  } catch (e) {
    console.error("[cron/daily]", e);
    return NextResponse.json({ error: "Fallo en tarea diaria (cron)." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
