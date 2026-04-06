import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { listActiveReservationsForCalendarMonth } from "@/lib/reservations/admin-queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const y = Number(url.searchParams.get("year"));
  const m = Number(url.searchParams.get("month"));
  if (!Number.isFinite(y) || y < 2000 || y > 2100 || !Number.isFinite(m) || m < 1 || m > 12) {
    return NextResponse.json({ error: "Año o mes inválido." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const active = await listActiveReservationsForCalendarMonth(db, y, m);
    const occupiedByDate: Record<string, string[]> = {};

    for (const r of active) {
      const dateKey = r.dateKey;
      const timeLocal = r.timeLocal;
      if (!occupiedByDate[dateKey]) occupiedByDate[dateKey] = [];
      if (!occupiedByDate[dateKey].includes(timeLocal)) occupiedByDate[dateKey].push(timeLocal);
    }

    return NextResponse.json({ occupiedByDate });
  } catch (e) {
    console.error("[api/reservations/occupied GET]", e);
    return NextResponse.json({ error: "No se pudo consultar ocupación." }, { status: 500 });
  }
}
