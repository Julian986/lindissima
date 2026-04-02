import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { expirePendingReservations } from "@/lib/reservations/service";

export const dynamic = "force-dynamic";

/**
 * Vencimiento de reservas pending_payment. Protegé con CRON_SECRET en Authorization: Bearer ...
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

  try {
    const db = await getDb();
    const modified = await expirePendingReservations(db);
    return NextResponse.json({ ok: true, expiredCount: modified });
  } catch (e) {
    console.error("[cron/expire-reservations]", e);
    return NextResponse.json({ error: "Fallo al expirar reservas." }, { status: 500 });
  }
}
