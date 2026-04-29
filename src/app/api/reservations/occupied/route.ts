import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { listActiveReservationsForCalendarMonth } from "@/lib/reservations/admin-queries";
import { listAgendaBlocksForCalendarMonth, agendaBlockAppliesToDateKey } from "@/lib/booking/agenda-blocks";
import { getScheduleTimesForDate } from "@/lib/booking/salon-schedule";

export const dynamic = "force-dynamic";

/** Convierte "HH:MM" a minutos desde medianoche. */
function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Dado un bloque (inicio + duración), retorna cuáles slots del día quedan cubiertos. */
function slotsBlockedByInterval(
  allSlots: string[],
  blockTime: string,
  durationMinutes: number,
): string[] {
  const blockStart = toMinutes(blockTime);
  const blockEnd = blockStart + durationMinutes;
  return allSlots.filter((s) => {
    const sm = toMinutes(s);
    return sm >= blockStart && sm < blockEnd;
  });
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const y = Number(url.searchParams.get("year"));
  const m = Number(url.searchParams.get("month"));
  if (!Number.isFinite(y) || y < 2000 || y > 2100 || !Number.isFinite(m) || m < 1 || m > 12) {
    return NextResponse.json({ error: "Año o mes inválido." }, { status: 400 });
  }

  try {
    const db = await getDb();

    // ── Reservas activas del mes ───────────────────────────────────────────
    const [active, blocks] = await Promise.all([
      listActiveReservationsForCalendarMonth(db, y, m),
      listAgendaBlocksForCalendarMonth(db, y, m),
    ]);

    const occupiedByDate: Record<string, string[]> = {};

    function addOccupied(dateKey: string, timeLocal: string) {
      if (!occupiedByDate[dateKey]) occupiedByDate[dateKey] = [];
      if (!occupiedByDate[dateKey].includes(timeLocal)) occupiedByDate[dateKey].push(timeLocal);
    }

    for (const r of active) {
      addOccupied(r.dateKey, r.timeLocal);
    }

    // ── Bloques de agenda → calcular qué slots cubren ─────────────────────
    if (blocks.length > 0) {
      const lastDay = new Date(y, m, 0).getDate();
      for (let d = 1; d <= lastDay; d++) {
        const dateKey = `${y}-${pad2(m)}-${pad2(d)}`;
        const allSlots = getScheduleTimesForDate(dateKey);
        if (allSlots.length === 0) continue;

        for (const block of blocks) {
          if (!agendaBlockAppliesToDateKey(block, dateKey)) continue;
          const blocked = slotsBlockedByInterval(allSlots, block.timeLocal, block.durationMinutes);
          for (const slot of blocked) {
            addOccupied(dateKey, slot);
          }
        }
      }
    }

    return NextResponse.json({ occupiedByDate });
  } catch (e) {
    console.error("[api/reservations/occupied GET]", e);
    return NextResponse.json({ error: "No se pudo consultar ocupación." }, { status: 500 });
  }
}
