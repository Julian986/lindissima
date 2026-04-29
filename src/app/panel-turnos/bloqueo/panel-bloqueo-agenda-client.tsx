"use client";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { buildMonthGrid, monthTitle, WEEK_LETTERS, formatSalonDisplayDate } from "@/lib/booking/salon-schedule";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function hhmmToMinutes(hhmm: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function PanelBloqueoAgendaClient() {
  const router = useRouter();
  const anchorInit = todayYmd();
  const [anchorDateKey, setAnchorDateKey] = useState(anchorInit);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarWrapRef = useRef<HTMLDivElement>(null);

  const [timeLocal, setTimeLocal] = useState("14:00");
  const [endTimeLocal, setEndTimeLocal] = useState("15:30");
  const [recurrenceType, setRecurrenceType] = useState<"once" | "weekly">("once");
  const [untilDateKey, setUntilDateKey] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grid = useMemo(() => buildMonthGrid(calYear, calMonth), [calYear, calMonth]);

  useEffect(() => {
    if (!calendarOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (calendarWrapRef.current && !calendarWrapRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [calendarOpen]);

  const durationMinutes = useMemo(() => {
    const start = hhmmToMinutes(timeLocal);
    const end = hhmmToMinutes(endTimeLocal);
    if (start === null || end === null) return 0;
    if (end <= start) return 0;
    return end - start;
  }, [timeLocal, endTimeLocal]);

  const canSubmit = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(anchorDateKey)) return false;
    if (!/^\d{2}:\d{2}$/.test(timeLocal) || !/^\d{2}:\d{2}$/.test(endTimeLocal)) return false;
    if (durationMinutes < 15 || durationMinutes > 12 * 60) return false;
    if (recurrenceType === "weekly" && untilDateKey.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(untilDateKey.trim())) {
      return false;
    }
    return true;
  }, [anchorDateKey, timeLocal, endTimeLocal, durationMinutes, recurrenceType, untilDateKey]);

  function prevCalMonth() {
    if (calMonth === 1) { setCalMonth(12); setCalYear((y) => y - 1); return; }
    setCalMonth((mo) => mo - 1);
  }
  function nextCalMonth() {
    if (calMonth === 12) { setCalMonth(1); setCalYear((y) => y + 1); return; }
    setCalMonth((mo) => mo + 1);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/panel-turnos/agenda-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          anchorDateKey,
          timeLocal,
          durationMinutes,
          recurrenceType,
          untilDateKey: recurrenceType === "weekly" && untilDateKey.trim() ? untilDateKey.trim() : null,
          notes: notes.trim() || null,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? "No se pudo guardar."); return; }
      router.push("/panel-turnos");
    } catch {
      setError("Error de red. Probá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#111111] pb-24 text-[var(--soft-gray)]">
      <div className="mx-auto max-w-md px-4 pt-6">
        <header className="mb-6 flex items-center gap-3">
          <Link
            href="/panel-turnos"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-[#171717] text-[var(--soft-gray)]/80 hover:bg-[#1d1d1d]"
            aria-label="Volver al panel"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/90 to-orange-700/90 text-white shadow-[0_8px_22px_rgba(180,83,9,0.35)]">
              <Lock className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-[20px] leading-tight text-[var(--premium-gold)]">Bloqueo de agenda</h1>
              <p className="text-[12px] text-[var(--soft-gray)]/55">Lindissima no disponible en esa franja</p>
            </div>
          </div>
        </header>

        <section className="space-y-4 overflow-visible rounded-[28px] border border-white/8 bg-[#171717] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
          {/* Selector de fecha */}
          <div ref={calendarWrapRef} className="relative">
            <p className="text-[11px] tracking-[0.12em] text-[var(--soft-gray)]/55">Fecha (primera ocurrencia)</p>
            <button
              type="button"
              onClick={() => setCalendarOpen((o) => !o)}
              className="mt-1.5 flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#141414] px-3 py-3 text-left text-[15px] text-[var(--soft-gray)] outline-none transition hover:border-white/16 focus:border-[var(--premium-gold)]/55"
            >
              <span className="flex min-w-0 items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-[var(--premium-gold)]/85" strokeWidth={1.85} />
                <span className="truncate">{formatSalonDisplayDate(anchorDateKey)}</span>
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--soft-gray)]/55 transition ${calendarOpen ? "rotate-180" : ""}`} strokeWidth={2} />
            </button>

            {calendarOpen ? (
              <div className="absolute z-50 mt-2 w-full rounded-[28px] border border-white/8 bg-[#171717] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                <div className="relative mb-3 flex items-center justify-center px-10">
                  <button type="button" onClick={prevCalMonth} className="absolute left-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-[var(--soft-gray)]/70 hover:bg-white/5">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-center text-[15px] font-semibold capitalize tracking-tight text-[var(--soft-gray)]">
                    {monthTitle(calYear, calMonth)}
                  </span>
                  <button type="button" onClick={nextCalMonth} className="absolute right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-[var(--soft-gray)]/70 hover:bg-white/5">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-semibold tracking-wide text-[var(--soft-gray)]/45">
                  {WEEK_LETTERS.map((L) => <div key={L} className="py-2">{L}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-y-2 text-center">
                  {grid.map((cell) => {
                    const sel = cell.dateKey === anchorDateKey;
                    return (
                      <button
                        key={`${cell.dateKey}-${cell.inMonth}`}
                        type="button"
                        onClick={() => { setAnchorDateKey(cell.dateKey); setCalendarOpen(false); }}
                        className="flex w-full cursor-pointer flex-col items-center py-1"
                      >
                        <span className={["flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-semibold leading-none transition", cell.inMonth ? "text-[var(--soft-gray)]" : "text-[var(--soft-gray)]/30", sel ? "bg-[var(--premium-gold)] text-black shadow-[0_8px_24px_rgba(206,120,50,0.35)]" : "hover:bg-white/5"].join(" ")}>
                          {cell.day}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {/* Hora inicio */}
          <div>
            <label className="text-[11px] tracking-[0.12em] text-[var(--soft-gray)]/55" htmlFor="startTime">Hora de inicio</label>
            <input id="startTime" type="time" step={900} value={timeLocal} onChange={(e) => setTimeLocal(e.target.value)}
              className="mt-1.5 w-full cursor-pointer rounded-xl border border-white/10 bg-[#141414] px-3 py-3 text-[15px] outline-none focus:border-[var(--premium-gold)]/55" />
          </div>

          {/* Hora fin */}
          <div>
            <label className="text-[11px] tracking-[0.12em] text-[var(--soft-gray)]/55" htmlFor="endTime">Hora de fin</label>
            <input id="endTime" type="time" step={900} value={endTimeLocal} onChange={(e) => setEndTimeLocal(e.target.value)}
              className="mt-1.5 w-full cursor-pointer rounded-xl border border-white/10 bg-[#141414] px-3 py-3 text-[15px] outline-none focus:border-[var(--premium-gold)]/55" />
            {durationMinutes > 0 && durationMinutes < 15 ? <p className="mt-1 text-[11px] text-amber-200/90">La franja debe durar al menos 15 minutos.</p> : null}
            {durationMinutes === 0 && hhmmToMinutes(timeLocal) !== null && hhmmToMinutes(endTimeLocal) !== null ? <p className="mt-1 text-[11px] text-amber-200/90">La hora de fin tiene que ser posterior a la de inicio.</p> : null}
            {durationMinutes > 0 ? <p className="mt-1 text-[11px] text-[var(--soft-gray)]/50">Duración: {durationMinutes} min</p> : null}
          </div>

          {/* Recurrencia */}
          <fieldset>
            <legend className="text-[11px] tracking-[0.12em] text-[var(--soft-gray)]/55">Recurrencia</legend>
            <div className="mt-2 space-y-2">
              <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 ${recurrenceType === "once" ? "border-[var(--premium-gold)]/55 bg-black/25" : "border-white/8"}`}>
                <input type="radio" name="recurrence" checked={recurrenceType === "once"} onChange={() => setRecurrenceType("once")} className="accent-[var(--premium-gold)]" />
                <span className="text-[14px]">Solo esta fecha</span>
              </label>
              <label className={`flex cursor-pointer flex-col gap-2 rounded-xl border px-3 py-2.5 ${recurrenceType === "weekly" ? "border-[var(--premium-gold)]/55 bg-black/25" : "border-white/8"}`}>
                <div className="flex items-center gap-2">
                  <input type="radio" name="recurrence" checked={recurrenceType === "weekly"} onChange={() => setRecurrenceType("weekly")} className="accent-[var(--premium-gold)]" />
                  <span className="text-[14px]">Cada semana (mismo día)</span>
                </div>
                {recurrenceType === "weekly" ? (
                  <div className="pl-6">
                    <label className="text-[11px] text-[var(--soft-gray)]/50" htmlFor="untilDate">Hasta (opcional)</label>
                    <input id="untilDate" type="date" value={untilDateKey} onChange={(e) => setUntilDateKey(e.target.value)}
                      className="mt-1 w-full cursor-pointer rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-[14px] outline-none focus:border-[var(--premium-gold)]/55" />
                  </div>
                ) : null}
              </label>
            </div>
          </fieldset>

          {/* Nota */}
          <div>
            <label className="text-[11px] tracking-[0.12em] text-[var(--soft-gray)]/55" htmlFor="notes">Nota interna (opcional)</label>
            <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: Vacaciones / capacitación"
              className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-[#141414] px-3 py-3 text-[14px] outline-none placeholder:text-[var(--soft-gray)]/35 focus:border-[var(--premium-gold)]/55" />
          </div>

          {error ? <p className="rounded-xl border border-red-500/35 bg-red-950/35 px-3 py-2 text-[13px] text-red-200/95">{error}</p> : null}

          <button type="button" disabled={!canSubmit || submitting} onClick={() => void handleSubmit()}
            className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-r from-amber-600 to-orange-700 text-[16px] font-semibold text-white shadow-[0_10px_28px_rgba(180,83,9,0.35)] disabled:cursor-not-allowed disabled:opacity-45">
            {submitting ? "Guardando…" : "Guardar bloqueo"}
          </button>
        </section>
      </div>
    </div>
  );
}
