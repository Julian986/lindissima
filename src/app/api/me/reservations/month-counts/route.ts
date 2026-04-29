import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { canonicalPhoneDigitsAR } from "@/lib/customer/phone-canonical-ar";
import { CUSTOMER_PROFILE_COOKIE, readCustomerProfilePhoneDigits } from "@/lib/customer/customer-session";
import { getDb } from "@/lib/mongodb";
import { listActiveReservationsForCalendarMonth } from "@/lib/reservations/admin-queries";
import { listAgendaBlocksForCalendarMonth, agendaBlockAppliesToDateKey } from "@/lib/booking/agenda-blocks";

export const dynamic = "force-dynamic";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CUSTOMER_PROFILE_COOKIE)?.value;
  const fromCookie = readCustomerProfilePhoneDigits(raw);
  if (!fromCookie) return NextResponse.json({ error: "No iniciaste sesión." }, { status: 401 });
  if (!canonicalPhoneDigitsAR(fromCookie)) return NextResponse.json({ error: "No iniciaste sesión." }, { status: 401 });

  const url = new URL(request.url);
  const y = Number(url.searchParams.get("year"));
  const m = Number(url.searchParams.get("month"));
  if (!Number.isFinite(y) || y < 2000 || y > 2100 || !Number.isFinite(m) || m < 1 || m > 12) {
    return NextResponse.json({ error: "Año o mes inválido." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const [active, blocks] = await Promise.all([
      listActiveReservationsForCalendarMonth(db, y, m),
      listAgendaBlocksForCalendarMonth(db, y, m),
    ]);

    const counts: Record<string, number> = {};

    for (const r of active) {
      counts[r.dateKey] = (counts[r.dateKey] ?? 0) + 1;
    }

    // También marcar días con bloques de agenda (el punto indica "hay algo ese día")
    if (blocks.length > 0) {
      const lastDay = new Date(y, m, 0).getDate();
      for (let d = 1; d <= lastDay; d++) {
        const dateKey = `${y}-${pad2(m)}-${pad2(d)}`;
        for (const block of blocks) {
          if (agendaBlockAppliesToDateKey(block, dateKey)) {
            counts[dateKey] = (counts[dateKey] ?? 0) + 1;
            break; // con un bloque alcanza para mostrar el punto
          }
        }
      }
    }

    return NextResponse.json({ counts });
  } catch (e) {
    console.error("[api/me/reservations/month-counts]", e);
    return NextResponse.json({ error: "No se pudo cargar el calendario." }, { status: 500 });
  }
}
