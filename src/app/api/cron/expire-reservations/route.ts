import { NextResponse } from "next/server";
import { cronUnauthorizedResponse } from "@/lib/cron/verify-secret";
import { getDb } from "@/lib/mongodb";
import { expirePendingReservations } from "@/lib/reservations/service";

export const dynamic = "force-dynamic";

async function run(request: Request) {
  const denied = cronUnauthorizedResponse(request);
  if (denied) return denied;

  try {
    const db = await getDb();
    const modified = await expirePendingReservations(db);
    return NextResponse.json({ ok: true, expiredCount: modified });
  } catch (e) {
    console.error("[cron/expire-reservations]", e);
    return NextResponse.json({ error: "Fallo al expirar reservas." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
