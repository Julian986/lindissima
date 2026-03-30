"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Hand,
  MessageCircle,
  Plus,
  ScanFace,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type PanelReservation = {
  id: string;
  treatmentName: string;
  subtitle: string;
  category: string;
  dateKey: string;
  timeLocal: string;
  displayDate: string;
  customerName: string;
  customerPhone: string;
  reservationStatus: string;
  paymentStatus: string;
  startsAt: string;
  createdAt: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function todayYmd(local: Date) {
  return `${local.getFullYear()}-${pad2(local.getMonth() + 1)}-${pad2(local.getDate())}`;
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const startDow = first.getDay();
  const mondayOffset = startDow === 0 ? 6 : startDow - 1;

  const prevLast = new Date(year, month - 1, 0).getDate();
  const pm = month === 1 ? 12 : month - 1;
  const py = month === 1 ? year - 1 : year;

  type Cell = { day: number; inMonth: boolean; dateKey: string };
  const cells: Cell[] = [];

  for (let i = 0; i < mondayOffset; i++) {
    const d = prevLast - mondayOffset + i + 1;
    cells.push({
      day: d,
      inMonth: false,
      dateKey: `${py}-${pad2(pm)}-${pad2(d)}`,
    });
  }
  for (let d = 1; d <= lastDay; d++) {
    cells.push({
      day: d,
      inMonth: true,
      dateKey: `${year}-${pad2(month)}-${pad2(d)}`,
    });
  }
  let nextM = month + 1;
  let nextY = year;
  if (nextM > 12) {
    nextM = 1;
    nextY += 1;
  }
  let dNext = 1;
  while (cells.length % 7 !== 0 || cells.length < 35) {
    cells.push({
      day: dNext,
      inMonth: false,
      dateKey: `${nextY}-${pad2(nextM)}-${pad2(dNext)}`,
    });
    dNext += 1;
  }

  return cells;
}

function monthTitle(year: number, month: number) {
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}

function weekdayLongFromKey(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const w = new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(dt);
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function dayLongFromKey(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" }).format(dt);
}

function durationLabel(category: string) {
  if (category === "Láser") return "45–60 min";
  if (category === "Facial") return "60 min";
  if (category === "Corporal") return "50 min";
  return "Turno";
}

function digitsOnlyPhone(s: string) {
  return s.replace(/\D/g, "");
}

/** Dígitos internacionales para wa.me (Argentina centrado, sin +). */
function whatsAppDigitsFromStoredPhone(raw: string): string | null {
  const d = digitsOnlyPhone(raw);
  if (d.length < 10 || d.length > 15) return null;
  if (d.startsWith("54")) return d;
  if (d.length === 11 && d.startsWith("9")) return `54${d}`;
  if (d.length === 10) return `549${d}`;
  return `54${d}`;
}

function whatsAppChatUrl(
  phoneRaw: string,
  opts: { customerName: string; displayDate: string; timeLocal: string; treatmentName: string },
): string | null {
  const n = whatsAppDigitsFromStoredPhone(phoneRaw);
  if (!n) return null;
  const name = opts.customerName.trim();
  const greet = name ? `Hola ${name}` : "Hola";
  const text = `${greet}, te escribimos desde Lindissima por tu turno: ${opts.treatmentName}, ${opts.displayDate} a las ${opts.timeLocal}.`;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

function ServiceIcon({ category }: { category: string }) {
  const cls = "h-5 w-5 shrink-0 text-[var(--premium-gold)]";
  if (category === "Láser") return <Sparkles className={cls} strokeWidth={1.85} />;
  if (category === "Facial") return <ScanFace className={cls} strokeWidth={1.85} />;
  if (category === "Corporal") return <Dumbbell className={cls} strokeWidth={1.85} />;
  return <Hand className={cls} strokeWidth={1.85} />;
}

function StatusBadge({ reservationStatus, paymentStatus }: { reservationStatus: string; paymentStatus: string }) {
  if (reservationStatus === "cancelled") {
    return (
      <span className="inline-block rounded-full bg-red-500/12 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-red-300/95">
        Cancelada
      </span>
    );
  }
  if (reservationStatus === "pending_payment" || paymentStatus === "pending") {
    return (
      <span className="inline-block rounded-full bg-amber-500/14 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-amber-300/90">
        Pendiente
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full bg-emerald-500/14 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-emerald-300/95">
      Confirmada
    </span>
  );
}

const WEEK_LETTERS = ["L", "M", "X", "J", "V", "S", "D"] as const;

export function PanelTurnosDashboard() {
  const router = useRouter();
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [list, setList] = useState<PanelReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoutBusy, setLogoutBusy] = useState(false);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const todayKey = todayYmd(now);

  const [selectedKey, setSelectedKey] = useState<string>(() => {
    const key = todayYmd(now);
    const [y, m] = key.split("-").map(Number);
    if (y === now.getFullYear() && m === now.getMonth() + 1) return key;
    return `${year}-${pad2(month)}-01`;
  });

  useEffect(() => {
    const curFirst = `${year}-${pad2(month)}-01`;
    const curLast = new Date(year, month, 0).getDate();
    const curLastKey = `${year}-${pad2(month)}-${pad2(curLast)}`;
    if (selectedKey >= curFirst && selectedKey <= curLastKey) return;

    if (todayKey >= curFirst && todayKey <= curLastKey) {
      setSelectedKey(todayKey);
      return;
    }
    setSelectedKey(curFirst);
  }, [year, month, selectedKey, todayKey]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/panel-turnos/reservations?year=${year}&month=${month}`);
        const data = (await res.json()) as { reservations?: PanelReservation[]; error?: string };
        if (!res.ok) {
          if (res.status === 401) router.refresh();
          return;
        }
        if (alive) setList(data.reservations ?? []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [year, month, router]);

  const countsByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of list) {
      m.set(r.dateKey, (m.get(r.dateKey) ?? 0) + 1);
    }
    return m;
  }, [list]);

  const dayReservations = useMemo(() => {
    return list
      .filter((r) => r.dateKey === selectedKey)
      .slice()
      .sort((a, b) => a.timeLocal.localeCompare(b.timeLocal));
  }, [list, selectedKey]);

  async function handleLogout() {
    setLogoutBusy(true);
    await fetch("/api/panel-turnos/logout", { method: "POST" });
    router.refresh();
    setLogoutBusy(false);
  }

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
      return;
    }
    setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
      return;
    }
    setMonth((m) => m + 1);
  }

  return (
    <div className="min-h-screen bg-[#111111] pb-24 text-[var(--soft-gray)]">
      <div className="mx-auto max-w-md px-4">
        <header className="flex items-start justify-between gap-4 pt-6 pb-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#b89253] to-[#e2cb9a] shadow-[0_10px_28px_rgba(201,169,106,0.22)]">
              <Sparkles className="h-6 w-6 text-[#1a150c]" strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-heading text-[18px] leading-tight text-[var(--premium-gold)]">Lindissima</h1>
              <p className="text-[12px] leading-relaxed text-[var(--soft-gray)]/58">Centro de Estética</p>
            </div>
          </div>
          <Link
            href="/turnos"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--premium-gold)]/35 bg-[#171717] text-[var(--premium-gold)] shadow-[0_6px_22px_rgba(0,0,0,0.35)] hover:bg-[#1d1d1d]"
            aria-label="Agregar turno"
          >
            <Plus className="h-5 w-5" strokeWidth={2.25} />
          </Link>
        </header>

        <section className="mt-5 rounded-[28px] border border-white/8 bg-[#171717] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
          <div className="relative mb-3 flex items-center justify-center px-10">
            <button
              type="button"
              onClick={prevMonth}
              className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-xl text-[var(--soft-gray)]/70 hover:bg-white/5 hover:text-[var(--soft-gray)]"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-center text-[15px] font-semibold capitalize tracking-tight text-[var(--soft-gray)]">
              {monthTitle(year, month)}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="absolute right-0 flex h-8 w-8 items-center justify-center rounded-xl text-[var(--soft-gray)]/70 hover:bg-white/5 hover:text-[var(--soft-gray)]"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-semibold tracking-wide text-[var(--soft-gray)]/45">
            {WEEK_LETTERS.map((L) => (
              <div key={L} className="py-2">
                {L}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2 text-center">
            {grid.map((cell) => {
              const sel = cell.dateKey === selectedKey;
              const count = countsByDay.get(cell.dateKey) ?? 0;
              const inMonth = cell.inMonth;

              return (
                <button
                  key={`${cell.dateKey}-${cell.inMonth}-${cell.day}`}
                  type="button"
                  onClick={() => setSelectedKey(cell.dateKey)}
                  className="flex w-full flex-col items-center py-1"
                >
                  <span
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-semibold leading-none transition",
                      inMonth ? "text-[var(--soft-gray)]" : "text-[var(--soft-gray)]/30",
                      sel
                        ? "bg-gradient-to-br from-[#b89253] to-[#d4b777] text-[#1a150c] shadow-[0_8px_24px_rgba(201,169,106,0.28)]"
                        : "hover:bg-white/5",
                    ].join(" ")}
                  >
                    {cell.day}
                  </span>
                  <span className="mt-0.5 flex h-2 items-center justify-center">
                    {count > 0 ? (
                      <span className="block h-1 w-1 rounded-full bg-[var(--premium-gold)]" />
                    ) : (
                      <span className="block h-1 w-1 rounded-full bg-transparent" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[22px] font-bold leading-tight tracking-tight text-[var(--soft-gray)]">
              {weekdayLongFromKey(selectedKey)}
            </p>
            <p className="mt-0.5 text-[14px] text-[var(--soft-gray)]/55">{dayLongFromKey(selectedKey)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-[#171717] px-3 py-2 text-[13px] text-[var(--soft-gray)]/88">
            <CalendarDays className="h-4 w-4 text-[var(--premium-gold)]" strokeWidth={1.75} />
            <span className="font-semibold">
              {dayReservations.length} {dayReservations.length === 1 ? "cita" : "citas"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {loading ? (
            <p className="py-10 text-center text-[14px] text-[var(--soft-gray)]/55">Cargando agenda…</p>
          ) : dayReservations.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-[var(--soft-gray)]/55">No hay turnos este día.</p>
          ) : (
            dayReservations.map((r) => {
              const waUrl = whatsAppChatUrl(r.customerPhone, {
                customerName: r.customerName,
                displayDate: r.displayDate,
                timeLocal: r.timeLocal,
                treatmentName: r.treatmentName,
              });
              return (
              <article
                key={r.id}
                className="rounded-[20px] border border-white/8 bg-[#171717] px-4 py-4 shadow-[0_10px_32px_rgba(0,0,0,0.32)]"
              >
                <div className="flex gap-3">
                  <div className="w-[52px] shrink-0 text-left">
                    <p className="text-[15px] font-bold leading-none text-[var(--soft-gray)]">{r.timeLocal}</p>
                    <p className="mt-2 text-[11px] leading-none text-[var(--soft-gray)]/48">{durationLabel(r.category)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex gap-2">
                      <ServiceIcon category={r.category} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold leading-snug text-[var(--soft-gray)]">{r.treatmentName}</p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[var(--soft-gray)]/58">
                          <User className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                          <span className="truncate">{r.customerName || "Cliente"}</span>
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusBadge reservationStatus={r.reservationStatus} paymentStatus={r.paymentStatus} />
                          {waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/16 px-3 py-1.5 text-[11px] font-semibold text-[#6ee7a5] ring-1 ring-[#25D366]/35 transition hover:bg-[#25D366]/24"
                            >
                              <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
                              WhatsApp
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
            })
          )}
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutBusy}
            className="text-[13px] text-[var(--soft-gray)]/50 underline-offset-4 hover:text-[var(--premium-gold)] hover:underline disabled:opacity-50"
          >
            Cerrar sesión del panel
          </button>
        </div>
      </div>
    </div>
  );
}
