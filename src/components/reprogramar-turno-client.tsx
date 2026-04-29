"use client";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  buildMonthGrid,
  getScheduleTimesForDate,
  WEEK_LETTERS,
  monthTitle,
} from "@/lib/booking/salon-schedule";
import { argentinaTodayDateKey, minPublicBookableDateKey } from "@/lib/booking/public-slot-lead";

type LoadedReservation = {
  id: string;
  treatmentName: string;
  subtitle: string;
  dateKey: string;
  timeLocal: string;
  displayDate: string;
  reservationStatus: string;
  source?: string;
};

type ReprogramDayRow =
  | { kind: "available"; timeLocal: string }
  | { kind: "occupied"; timeLocal: string; customerName: string; treatmentName: string };

function canRescheduleStatus(s: string) {
  return s === "confirmed" || s === "pending_payment";
}

function yearMonthFromDateKey(dateKey: string): { year: number; month: number } {
  const [y, m] = dateKey.split("-").map(Number);
  return {
    year: Number.isFinite(y) ? y : new Date().getFullYear(),
    month: Number.isFinite(m) && m >= 1 && m <= 12 ? m : 1,
  };
}

function weekdayLongFromKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const w = new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(new Date(y, m - 1, d));
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function dayLongFromKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" }).format(new Date(y, m - 1, d));
}

export function ReprogramarTurnoClient({
  reservationId,
  variant = "customer",
}: {
  reservationId: string;
  variant?: "customer" | "panel";
}) {
  const router = useRouter();
  const [reservation, setReservation] = useState<LoadedReservation | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dateKey, setDateKey] = useState("");
  const [slotRows, setSlotRows] = useState<ReprogramDayRow[] | null>(null);
  const [monthCounts, setMonthCounts] = useState<Map<string, number> | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [timeLocal, setTimeLocal] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth() + 1);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const dayPickerRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const isPanel = variant === "panel";
  const reservationBaseUrl = isPanel
    ? `/api/panel-turnos/reservations/${encodeURIComponent(reservationId)}`
    : `/api/me/reservations/${encodeURIComponent(reservationId)}`;
  const daySlotsUrl = (dk: string) =>
    isPanel
      ? `/api/panel-turnos/reprogramar/day-slots?dateKey=${encodeURIComponent(dk)}&excludeReservationHexId=${encodeURIComponent(reservationId)}`
      : `/api/me/reservations/${encodeURIComponent(reservationId)}/day-slots?dateKey=${encodeURIComponent(dk)}`;
  const backHref = isPanel ? "/panel-turnos" : "/perfil/mis-turnos";

  const minDateKey = useMemo(() => {
    if (isPanel) return argentinaTodayDateKey();
    if (!reservation) return argentinaTodayDateKey();
    return reservation.source === "panel" ? argentinaTodayDateKey() : minPublicBookableDateKey();
  }, [isPanel, reservation]);

  // Cargar la reserva
  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoadError(null);
      try {
        const res = await fetch(reservationBaseUrl, {
          credentials: "same-origin",
        });
        const data = (await res.json()) as LoadedReservation & { error?: string };
        if (!alive) return;
        if (!res.ok) {
          setLoadError(
            res.status === 401
              ? isPanel ? "No autorizado. Iniciá sesión en el panel." : "Iniciá sesión desde Perfil con tu WhatsApp."
              : (data.error ?? "No se pudo cargar el turno."),
          );
          return;
        }
        setReservation(data);
        setDateKey(data.dateKey);
        const ym = yearMonthFromDateKey(data.dateKey);
        setCalendarYear(ym.year);
        setCalendarMonth(ym.month);
      } catch {
        if (alive) setLoadError("Sin conexión.");
      }
    })();
    return () => { alive = false; };
  }, [reservationId]);

  // Cargar slots del día seleccionado
  const fetchSlots = useCallback(async () => {
    if (!reservation || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) { setSlotRows(null); return; }
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const res = await fetch(daySlotsUrl(dateKey), { credentials: "same-origin", cache: "no-store" });
      const data = (await res.json()) as { rows?: ReprogramDayRow[]; error?: string; leadTimeError?: string };
      if (!res.ok) { setSlotRows([]); setSlotsError(data.error ?? "No se pudieron cargar los horarios."); return; }
      if (data.leadTimeError) { setSlotRows([]); setSlotsError(data.leadTimeError); return; }
      setSlotRows(Array.isArray(data.rows) ? data.rows : []);
    } catch {
      setSlotRows([]); setSlotsError("Sin conexión.");
    } finally {
      setSlotsLoading(false);
    }
  }, [dateKey, reservation, reservationId]);

  useEffect(() => { void fetchSlots(); }, [fetchSlots]);
  useEffect(() => { setTimeLocal(""); setSaveError(null); }, [dateKey]);

  // Scroll al confirmar
  useEffect(() => {
    if (!timeLocal) return;
    const id = window.setTimeout(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }, 60);
    return () => window.clearTimeout(id);
  }, [timeLocal]);

  // Conteo mensual de turnos para el calendario
  useEffect(() => {
    if (!reservation) return;
    let alive = true;
    void (async () => {
      try {
        const res = await fetch(
          `/api/me/reservations/month-counts?year=${calendarYear}&month=${calendarMonth}`,
          { credentials: "same-origin" },
        );
        if (!alive || !res.ok) return;
        const data = (await res.json()) as { counts?: Record<string, number> };
        if (alive) setMonthCounts(new Map(Object.entries(data.counts ?? {}).map(([k, v]) => [k, Number(v) || 0])));
      } catch {
        if (alive) setMonthCounts(new Map());
      }
    })();
    return () => { alive = false; };
  }, [reservation, calendarYear, calendarMonth]);

  // Cerrar calendario al hacer clic fuera
  useEffect(() => {
    if (!dayPickerOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (dayPickerRef.current && !dayPickerRef.current.contains(e.target as Node)) {
        setDayPickerOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [dayPickerOpen]);

  async function handleSave() {
    if (!reservation || !timeLocal) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(reservationBaseUrl, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateKey, timeLocal }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { setSaveError(data.error ?? "No se pudo guardar."); return; }
      // Para el cliente añadimos ?rescheduled=1 para que mis-turnos pueda recargar y mostrar confirmación
      const dest = variant === "customer" ? `${backHref}?rescheduled=1` : backHref;
      router.push(dest);
      router.refresh();
    } catch {
      setSaveError("Sin conexión.");
    } finally {
      setSaving(false);
    }
  }

  const movable = reservation ? canRescheduleStatus(reservation.reservationStatus) : false;
  const panelMonthGrid = useMemo(() => buildMonthGrid(calendarYear, calendarMonth), [calendarYear, calendarMonth]);

  // Para el calendario: también marcar días sin grilla como deshabilitados
  function isDayDisabled(dk: string): boolean {
    if (dk < minDateKey) return true;
    return getScheduleTimesForDate(dk).length === 0;
  }

  function calPrevMonth() {
    if (calendarMonth === 1) { setCalendarMonth(12); setCalendarYear((y) => y - 1); }
    else setCalendarMonth((m) => m - 1);
  }
  function calNextMonth() {
    if (calendarMonth === 12) { setCalendarMonth(1); setCalendarYear((y) => y + 1); }
    else setCalendarMonth((m) => m + 1);
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-6 pb-24">
      <header className="mb-5 flex items-center gap-3">
        <Link
          href={backHref}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-[#171717] text-[var(--soft-gray)]/88 hover:bg-[#1d1d1d]"
          aria-label="Volver"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.85} />
        </Link>
        <div>
          <h1 className="font-heading text-[22px] leading-tight text-[var(--premium-gold)]">Cambiar horario</h1>
          <p className="mt-0.5 text-[12px] text-[var(--soft-gray)]/55">Elegí otro día u hora para el mismo servicio</p>
        </div>
      </header>

      {loadError ? (
        <p role="alert" className="mb-4 rounded-xl border border-amber-500/35 bg-amber-950/25 px-3 py-2.5 text-[13px] text-amber-100/95">
          {loadError}{" "}
          {!isPanel ? (
            <Link href="/perfil#acceso" className="font-semibold text-[var(--premium-gold)] underline-offset-2 hover:underline">
              Ir a acceso
            </Link>
          ) : null}
        </p>
      ) : null}

      {!loadError && reservation === null ? (
        <p className="py-10 text-center text-[14px] text-[var(--soft-gray)]/55">Cargando…</p>
      ) : null}

      {reservation && !movable ? (
        <p className="rounded-xl border border-white/10 bg-[#171717] px-4 py-4 text-[14px] text-[var(--soft-gray)]/80">
          Este turno no se puede reprogramar (está cancelado o ya no admite cambios).
        </p>
      ) : null}

      {reservation && movable ? (
        <div className="space-y-5">
          {/* Turno actual */}
          <section className="rounded-2xl border border-white/8 bg-[#171717] px-4 py-4">
            <p className="text-[16px] font-semibold text-[var(--soft-gray)]">{reservation.treatmentName}</p>
            <p className="mt-0.5 text-[12px] text-[var(--soft-gray)]/58">{reservation.subtitle}</p>
            <p className="mt-3 text-[13px] text-[var(--soft-gray)]/55">
              Turno actual:{" "}
              <span className="font-semibold text-[var(--premium-gold)]">
                {reservation.timeLocal} · {reservation.displayDate}
              </span>
            </p>
          </section>

          {/* Selector de día */}
          <div>
            <p className="mb-2 text-[12px] font-semibold tracking-wide text-[var(--soft-gray)]/70">Día</p>
            <div ref={dayPickerRef} className="relative">
              <button
                type="button"
                onClick={() => setDayPickerOpen((o) => !o)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/12 bg-[#141414] px-3 py-3 text-left outline-none transition hover:border-white/18 focus-visible:border-[var(--premium-gold)]/45"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <CalendarDays className="h-4 w-4 shrink-0 text-[var(--premium-gold)]" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1 text-[14px] leading-snug text-[var(--soft-gray)]">
                    {/^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? (
                      <>
                        <span className="font-semibold">{weekdayLongFromKey(dateKey)}</span>
                        <span className="text-[var(--soft-gray)]/60"> · </span>
                        <span className="capitalize text-[var(--soft-gray)]/75">{dayLongFromKey(dateKey)}</span>
                      </>
                    ) : (
                      <span className="text-[var(--soft-gray)]/55">Elegí un día</span>
                    )}
                  </span>
                </span>
                <ChevronDown
                  className={["h-5 w-5 shrink-0 text-[var(--soft-gray)]/50 transition", dayPickerOpen ? "rotate-180" : ""].join(" ")}
                  strokeWidth={2}
                />
              </button>

              {dayPickerOpen ? (
                <div className="absolute left-0 right-0 z-30 mt-2 rounded-[28px] border border-white/10 bg-[#171717] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
                  {/* Navegación mes */}
                  <div className="relative mb-3 flex items-center justify-center px-10">
                    <button type="button" onClick={calPrevMonth}
                      className="absolute left-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-[var(--soft-gray)]/70 hover:bg-white/5"
                      aria-label="Mes anterior">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-center text-[15px] font-semibold capitalize tracking-tight text-[var(--soft-gray)]">
                      {monthTitle(calendarYear, calendarMonth)}
                    </span>
                    <button type="button" onClick={calNextMonth}
                      className="absolute right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-[var(--soft-gray)]/70 hover:bg-white/5"
                      aria-label="Mes siguiente">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Letras de días */}
                  <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-semibold tracking-wide text-[var(--soft-gray)]/45">
                    {WEEK_LETTERS.map((L) => <div key={L} className="py-2">{L}</div>)}
                  </div>

                  {/* Grilla días */}
                  <div className="grid grid-cols-7 gap-y-2 text-center">
                    {panelMonthGrid.map((cell) => {
                      const sel = cell.dateKey === dateKey;
                      const disabled = isDayDisabled(cell.dateKey);
                      const busyCount = monthCounts?.get(cell.dateKey) ?? 0;
                      return (
                        <button
                          key={cell.dateKey + String(cell.inMonth)}
                          type="button"
                          disabled={disabled}
                          onClick={() => { if (!disabled) { setDateKey(cell.dateKey); setDayPickerOpen(false); } }}
                          className={["flex w-full flex-col items-center py-1", disabled ? "cursor-not-allowed" : "cursor-pointer"].join(" ")}
                        >
                          <span className={[
                            "flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-semibold leading-none transition",
                            cell.inMonth && !disabled ? "text-[var(--soft-gray)]" : "text-[var(--soft-gray)]/30",
                            disabled ? "opacity-35" : "",
                            sel && !disabled
                              ? "bg-[var(--premium-gold)] text-black shadow-[0_8px_24px_rgba(206,120,50,0.35)]"
                              : !disabled ? "hover:bg-white/5" : "",
                          ].join(" ")}>
                            {cell.day}
                          </span>
                          <span className="mt-0.5 flex h-2 items-center justify-center">
                            {busyCount > 0
                              ? <span className="block h-1 w-1 rounded-full bg-[var(--premium-gold)]" />
                              : <span className="block h-1 w-1 rounded-full bg-transparent" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Selector de horario */}
          <div>
            <p className="mb-2 text-[12px] font-semibold tracking-wide text-[var(--soft-gray)]/70">Horario</p>
            {slotsLoading ? (
              <div className="flex items-center gap-2 py-6 text-[14px] text-[var(--soft-gray)]/55">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando horarios…
              </div>
            ) : slotsError ? (
              <p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/20 px-3 py-2.5 text-[13px] text-red-200/95">
                {slotsError}
              </p>
            ) : !slotRows || slotRows.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-[var(--soft-gray)]/55">
                No hay horarios disponibles ese día.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {slotRows.map((row) => {
                  if (row.kind === "available") {
                    return (
                      <li key={row.timeLocal}>
                        <button
                          type="button"
                          onClick={() => setTimeLocal(row.timeLocal)}
                          className={[
                            "w-full cursor-pointer rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-semibold transition",
                            timeLocal === row.timeLocal
                              ? "border-[var(--premium-gold)] bg-[var(--premium-gold)]/18 text-[var(--premium-gold)]"
                              : "border-white/12 bg-[#171717] text-[var(--soft-gray)]/88 hover:border-white/20",
                          ].join(" ")}
                        >
                          <span className="font-mono tabular-nums">{row.timeLocal}</span>
                          <span className="ml-2 text-[12px] font-medium text-emerald-300/90">Disponible</span>
                        </button>
                      </li>
                    );
                  }
                  return (
                    <li key={row.timeLocal} className="rounded-xl border border-white/10 bg-[#141414] px-3.5 py-2.5 text-[13px] text-[var(--soft-gray)]/72">
                      <span className="font-mono tabular-nums font-semibold text-[var(--soft-gray)]">{row.timeLocal}</span>
                      <span className="ml-2 text-[12px] text-rose-200/85">Ocupado</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {saveError ? (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/20 px-3 py-2.5 text-[13px] text-red-200/95">
              {saveError}
            </p>
          ) : null}

          <button
            ref={confirmButtonRef}
            type="button"
            disabled={saving || !timeLocal}
            onClick={() => void handleSave()}
            className="w-full cursor-pointer rounded-2xl bg-[var(--premium-gold)] py-3.5 text-[15px] font-bold text-black shadow-[0_10px_28px_rgba(206,120,50,0.3)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {saving ? "Guardando…" : "Confirmar nuevo horario"}
          </button>
        </div>
      ) : null}
    </main>
  );
}
