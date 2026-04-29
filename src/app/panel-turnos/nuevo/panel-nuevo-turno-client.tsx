"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  buildMonthGrid,
  formatSalonDisplayDate,
  getScheduleTimesForDate,
  monthTitle,
  WEEK_LETTERS,
} from "@/lib/booking/salon-schedule";

// ── Tratamientos ────────────────────────────────────────────────────────────
type TreatmentOption = { id: string; name: string; subtitle: string; category: string };
type TreatmentCategory = "Láser" | "Facial" | "Corporal";

const TREATMENT_CATEGORIES: TreatmentCategory[] = ["Láser", "Facial", "Corporal"];

const TREATMENT_OPTIONS: TreatmentOption[] = [
  { id: "depilacion-laser",       name: "Depilación Láser",          subtitle: "Soprano Titanium · 4 ondas",       category: "Láser" },
  { id: "limpieza-facial-profunda", name: "Limpieza Facial Profunda", subtitle: "Higiene, extracción y renovación", category: "Facial" },
  { id: "dermapen",               name: "Dermapen",                  subtitle: "Renovación y glow",                category: "Facial" },
  { id: "exosomas",               name: "Exosomas",                  subtitle: "Reparación intensiva",             category: "Facial" },
  { id: "radiofrecuencia-facial", name: "Radiofrecuencia Facial",    subtitle: "Reafirmación no invasiva",         category: "Facial" },
  { id: "alta-frecuencia",        name: "Alta Frecuencia",           subtitle: "Oxigenación y equilibrio",         category: "Facial" },
  { id: "electroporacion",        name: "Electroporación",           subtitle: "Vehiculización de activos",        category: "Facial" },
  { id: "radiofrecuencia-corporal", name: "Radiofrecuencia Corporal", subtitle: "Reafirmación y tonicidad",       category: "Corporal" },
  { id: "cavitacion",             name: "Cavitación",                subtitle: "Modelado corporal",                category: "Corporal" },
  { id: "drenaje-linfatico",      name: "Drenaje Linfático",         subtitle: "Desinflamación y circulación",    category: "Corporal" },
  { id: "maderoterapia",          name: "Maderoterapia",             subtitle: "Moldeado y firmeza",               category: "Corporal" },
  { id: "masajes-reductores",     name: "Masajes Reductores",        subtitle: "Trabajo focalizado",               category: "Corporal" },
  { id: "electroestimulador",     name: "Electroestimulador",        subtitle: "Tonificación muscular",            category: "Corporal" },
  { id: "endermologie",           name: "Endermologie",              subtitle: "Estimulación mecánica",            category: "Corporal" },
];

function isLikelyWhatsappNumber(raw: string) {
  return raw.replace(/\D/g, "").length >= 10;
}

export function PanelNuevoTurnoClient() {
  const router = useRouter();

  // Tratamiento
  const [treatmentId, setTreatmentId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TreatmentCategory | null>(null);

  // Fecha / horario
  const [dateKey, setDateKey] = useState("");
  const [timeLocal, setTimeLocal] = useState("");
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1);

  // Ocupados por día (para el punto del calendario)
  const [countByDay, setCountByDay] = useState<Map<string, number>>(new Map());

  // Slots del día seleccionado (con estado real de ocupación)
  type DaySlotRow = { kind: "available"; timeLocal: string } | { kind: "occupied"; timeLocal: string; customerName: string; treatmentName: string };
  const [daySlotRows, setDaySlotRows] = useState<DaySlotRow[] | "loading" | null>(null);

  // Datos del cliente
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [panelNotes, setPanelNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTreatment = useMemo(
    () => TREATMENT_OPTIONS.find((t) => t.id === treatmentId),
    [treatmentId],
  );
  const visibleTreatments = useMemo(
    () => (activeCategory ? TREATMENT_OPTIONS.filter((t) => t.category === activeCategory) : []),
    [activeCategory],
  );
  const grid = useMemo(() => buildMonthGrid(calYear, calMonth), [calYear, calMonth]);

  // Cargar reservas y bloques del mes para el punto en el calendario
  useEffect(() => {
    let alive = true;
    void fetch(`/api/panel-turnos/reservations?year=${calYear}&month=${calMonth}`, { credentials: "same-origin", cache: "no-store" })
      .then((r) => r.json())
      .then((data: { reservations?: { dateKey: string }[]; agendaBlocks?: { anchorDateKey: string }[] }) => {
        if (!alive) return;
        const m = new Map<string, number>();
        for (const r of data.reservations ?? []) m.set(r.dateKey, (m.get(r.dateKey) ?? 0) + 1);
        // También marcar días con bloqueos
        for (const b of data.agendaBlocks ?? []) m.set(b.anchorDateKey, (m.get(b.anchorDateKey) ?? 0) + 1);
        setCountByDay(m);
      })
      .catch(() => { if (alive) setCountByDay(new Map()); });
    return () => { alive = false; };
  }, [calYear, calMonth]);

  // Al cambiar el día, cargar slots reales (con ocupados/bloqueados)
  useEffect(() => {
    if (!dateKey) { setDaySlotRows(null); return; }
    setDaySlotRows("loading");
    setTimeLocal("");
    let alive = true;
    void fetch(`/api/panel-turnos/reprogramar/day-slots?dateKey=${encodeURIComponent(dateKey)}`, { credentials: "same-origin", cache: "no-store" })
      .then((r) => r.json())
      .then((data: { rows?: DaySlotRow[] }) => {
        if (!alive) return;
        setDaySlotRows(Array.isArray(data.rows) ? data.rows : []);
      })
      .catch(() => { if (alive) setDaySlotRows([]); });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  const hasSlot = Boolean(selectedTreatment && dateKey && timeLocal);
  const datosComplete = Boolean(customerName.trim().length >= 2 && isLikelyWhatsappNumber(customerPhone) && whatsappOptIn);
  const showPhoneHint = customerPhone.trim().length >= 8 && !isLikelyWhatsappNumber(customerPhone);

  function prevMonth() {
    if (calMonth === 1) { setCalMonth(12); setCalYear((y) => y - 1); } else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 12) { setCalMonth(1); setCalYear((y) => y + 1); } else setCalMonth((m) => m + 1);
  }

  function selectTreatment(id: string) {
    setTreatmentId(id);
    setTimeLocal("");
    setModalOpen(false);
    setActiveCategory(null);
  }

  function openModal() {
    setActiveCategory(selectedTreatment ? (selectedTreatment.category as TreatmentCategory) : null);
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!selectedTreatment || !dateKey || !timeLocal || !datosComplete) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treatmentId: selectedTreatment.id,
          treatmentName: selectedTreatment.name,
          subtitle: selectedTreatment.subtitle,
          category: selectedTreatment.category,
          dateKey,
          timeLocal,
          displayDate: formatSalonDisplayDate(dateKey),
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          whatsappOptIn,
          source: "panel",
        }),
      });
      const data = (await res.json()) as { id?: string; checkoutToken?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "No se pudo crear la reserva."); return; }
      if (!data.id || !data.checkoutToken) { setError("Respuesta inválida del servidor."); return; }

      const res2 = await fetch("/api/reservations/confirm-without-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: data.id, checkoutToken: data.checkoutToken }),
      });
      const data2 = (await res2.json()) as { error?: string };
      if (!res2.ok) { setError(data2.error ?? "No se pudo confirmar el turno."); return; }

      router.push("/panel-turnos");
      router.refresh();
    } catch {
      setError("Sin conexión o error de red.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#111111] pb-28 text-[var(--soft-gray)]">
      <div className="mx-auto max-w-md px-4 pt-6">
        <header className="mb-5 flex items-center gap-3">
          <Link href="/panel-turnos"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-[#171717] text-[var(--soft-gray)]/88 hover:bg-[#1d1d1d]"
            aria-label="Volver">
            <ChevronLeft className="h-5 w-5" strokeWidth={1.85} />
          </Link>
          <div>
            <h1 className="font-heading text-[22px] leading-tight text-[var(--premium-gold)]">Nuevo turno</h1>
            <p className="mt-0.5 text-[12px] text-[var(--soft-gray)]/55">Alta manual · sin pago</p>
          </div>
        </header>

        {/* ── Tratamiento ── */}
        <section className="mb-4 space-y-2">
          <button
            type="button"
            onClick={openModal}
            className={`flex w-full items-center justify-between rounded-2xl border bg-[#171717] px-4 py-3.5 text-left transition-all ${selectedTreatment ? "border-[var(--premium-gold)]/45" : "border-white/8"}`}
          >
            <div className="min-w-0">
              <p className="text-[11px] tracking-[0.14em] text-[var(--soft-gray)]/55">Paso 1 · Tratamiento</p>
              <p className="mt-1 text-[15px] font-semibold text-[var(--soft-gray)]">
                {selectedTreatment ? selectedTreatment.name : "Elegí tratamiento"}
              </p>
              {selectedTreatment ? (
                <p className="mt-0.5 text-[11px] text-[var(--soft-gray)]/55">{selectedTreatment.category} · {selectedTreatment.subtitle}</p>
              ) : (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[var(--premium-gold)]/90">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--premium-gold)]" />
                  <span>Tocá para elegir el servicio</span>
                </div>
              )}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--soft-gray)]/50" strokeWidth={1.8} />
          </button>
        </section>

        {/* ── Calendario ── */}
        <section className="mb-4 rounded-[24px] border border-white/8 bg-[#171717] p-4">
          <p className="mb-3 text-[11px] tracking-[0.14em] text-[var(--soft-gray)]/55">Paso 2 · Elegí el día</p>
          <div className="relative mb-3 flex items-center justify-center px-10">
            <button type="button" onClick={prevMonth}
              className="absolute left-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-[var(--soft-gray)]/70 hover:bg-white/5">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-center text-[15px] font-semibold capitalize tracking-tight">
              {monthTitle(calYear, calMonth)}
            </span>
            <button type="button" onClick={nextMonth}
              className="absolute right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-[var(--soft-gray)]/70 hover:bg-white/5">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-semibold tracking-wide text-[var(--soft-gray)]/45">
            {WEEK_LETTERS.map((L) => <div key={L} className="py-2">{L}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {grid.map((cell) => {
              const sel = cell.dateKey === dateKey;
              const hasSchedule = getScheduleTimesForDate(cell.dateKey).length > 0;
              const disabled = !cell.inMonth || !hasSchedule;
              const busy = (countByDay.get(cell.dateKey) ?? 0) > 0;
              return (
                <button
                  key={`${cell.dateKey}-${cell.inMonth}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => { setDateKey(cell.dateKey); setTimeLocal(""); }}
                  className="flex w-full cursor-pointer flex-col items-center py-1 disabled:cursor-not-allowed"
                >
                  <span className={[
                    "flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-semibold leading-none transition",
                    disabled ? "text-[var(--soft-gray)]/25 opacity-35" : "text-[var(--soft-gray)]",
                    sel && !disabled ? "bg-[var(--premium-gold)] text-black shadow-[0_8px_24px_rgba(206,120,50,0.3)]" : (!disabled ? "hover:bg-white/5" : ""),
                  ].join(" ")}>
                    {cell.day}
                  </span>
                  {/* Punto de actividad (mismo estilo que panel-turnos-dashboard) */}
                  <span className="mt-0.5 flex h-2 items-center justify-center">
                    {busy && !disabled
                      ? <span className="block h-1 w-1 rounded-full bg-[var(--premium-gold)]" />
                      : <span className="block h-1 w-1 rounded-full bg-transparent" />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Horarios ── */}
        {dateKey ? (
          <section className="mb-4 rounded-2xl border border-white/8 bg-[#171717] px-4 py-4">
            <p className="mb-3 text-[11px] tracking-[0.14em] text-[var(--soft-gray)]/55">
              Paso 3 · Horario — {formatSalonDisplayDate(dateKey)}
            </p>
            {daySlotRows === "loading" ? (
              <p className="py-2 text-center text-[13px] text-[var(--soft-gray)]/45">Cargando horarios…</p>
            ) : !daySlotRows || daySlotRows.length === 0 ? (
              <p className="text-center text-[13px] text-[var(--soft-gray)]/55">No hay horarios disponibles ese día.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {daySlotRows.map((row) => {
                  const isOccupied = row.kind === "occupied";
                  const isSel = timeLocal === row.timeLocal;
                  return (
                    <button
                      key={row.timeLocal}
                      type="button"
                      disabled={isOccupied}
                      title={isOccupied ? `Ocupado: ${row.customerName} — ${row.treatmentName}` : undefined}
                      onClick={() => setTimeLocal(row.timeLocal)}
                      className={[
                        "h-10 rounded-xl border text-[14px] font-semibold transition",
                        isOccupied
                          ? "cursor-not-allowed border-white/8 bg-[#141414] text-[var(--soft-gray)]/28 line-through"
                          : isSel
                            ? "cursor-pointer border-[var(--premium-gold)] bg-[var(--premium-gold)]/18 text-[var(--premium-gold)]"
                            : "cursor-pointer border-white/12 bg-[#141414] text-[var(--soft-gray)]/88 hover:border-white/20",
                      ].join(" ")}
                    >
                      {row.timeLocal}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {/* ── Datos del cliente ── */}
        {hasSlot ? (
          <section className="rounded-2xl border border-white/8 bg-[#171717] px-4 py-4 space-y-4">
            <div>
              <p className="text-[11px] tracking-[0.14em] text-[var(--soft-gray)]/55">Paso 4 · Datos del cliente</p>
              <p className="mt-0.5 text-[12px] text-[var(--soft-gray)]/55">
                {selectedTreatment!.name} · {formatSalonDisplayDate(dateKey)} · {timeLocal} hs
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="pn-name" className="text-[11px] tracking-[0.12em] text-[var(--soft-gray)]/55">Nombre y apellido</label>
                <input id="pn-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} autoComplete="name"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-3 text-[15px] text-[var(--soft-gray)] outline-none focus:border-[var(--premium-gold)]/55" />
              </div>
              <div>
                <label htmlFor="pn-phone" className="text-[11px] tracking-[0.12em] text-[var(--soft-gray)]/55">WhatsApp</label>
                <input id="pn-phone" type="tel" inputMode="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+54 9 11 2345-6789"
                  className={`mt-1.5 w-full rounded-xl border bg-[#141414] px-3 py-3 text-[15px] text-[var(--soft-gray)] outline-none focus:border-[var(--premium-gold)]/55 ${showPhoneHint ? "border-amber-500/45" : "border-white/10"}`} />
                {showPhoneHint ? <p className="mt-1 text-[11px] text-amber-200/90">Revisá el número (mín. 10 dígitos).</p> : null}
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-black/20 px-3 py-3">
                <input type="checkbox" checked={whatsappOptIn} onChange={(e) => setWhatsappOptIn(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--premium-gold)]" />
                <span className="text-[12px] leading-snug text-[var(--soft-gray)]/78">Recordatorios por WhatsApp</span>
              </label>
              <div>
                <label htmlFor="pn-notes" className="text-[11px] tracking-[0.12em] text-[var(--soft-gray)]/55">Notas internas (opcional)</label>
                <textarea id="pn-notes" rows={2} value={panelNotes} onChange={(e) => setPanelNotes(e.target.value)}
                  placeholder="Solo visible en el sistema…"
                  className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-[#141414] px-3 py-3 text-[14px] text-[var(--soft-gray)] outline-none placeholder:text-[var(--soft-gray)]/35 focus:border-[var(--premium-gold)]/55" />
              </div>
            </div>
            {error ? <p role="alert" className="rounded-xl border border-red-500/35 bg-red-950/35 px-3 py-2.5 text-center text-[12px] text-red-200/95">{error}</p> : null}
            <button type="button" disabled={!datosComplete || submitting} onClick={() => void handleSubmit()}
              className={`flex h-[50px] w-full items-center justify-center rounded-xl text-[15px] font-semibold transition-all ${datosComplete && !submitting ? "cursor-pointer bg-[var(--premium-gold)] text-black shadow-[0_8px_24px_rgba(206,120,50,0.3)]" : "cursor-not-allowed bg-[#2a2a2a] text-white/40"}`}>
              {submitting ? "Guardando…" : "Confirmar turno"}
            </button>
          </section>
        ) : null}
      </div>

      {/* ── Modal selector de tratamiento (bottom-sheet) ── */}
      {modalOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/60 backdrop-blur-[3px]">
          {/* Tap fuera para cerrar */}
          <button type="button" aria-label="Cerrar" onClick={() => { setModalOpen(false); setActiveCategory(null); }} className="absolute inset-0" />

          <div className="relative w-full rounded-t-[32px] border-t border-white/8 bg-[#161616] px-4 pt-3 pb-6 shadow-[0_-18px_40px_rgba(0,0,0,0.45)]">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/12" />

            <div className="mb-4 flex items-center justify-between">
              {activeCategory ? (
                <button type="button" onClick={() => setActiveCategory(null)}
                  className="text-[var(--soft-gray)]/75" aria-label="Volver a categorías">
                  <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
                </button>
              ) : (
                <span className="h-5 w-5" />
              )}
              <h2 className="font-heading text-[24px]">
                {activeCategory ?? "Elegí tratamiento"}
              </h2>
              <button type="button" onClick={() => { setModalOpen(false); setActiveCategory(null); }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-[var(--soft-gray)]/70 hover:bg-white/5"
                aria-label="Cerrar">
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {activeCategory ? (
              /* Lista de tratamientos de la categoría */
              <div className="max-h-[55vh] space-y-2 overflow-y-auto pb-2">
                {visibleTreatments.map((t) => (
                  <button key={t.id} type="button" onClick={() => selectTreatment(t.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${treatmentId === t.id ? "border-[var(--premium-gold)] bg-[var(--premium-gold)]/12" : "border-white/8 bg-[#1c1c1c] hover:bg-[#222]"}`}>
                    <p className="font-heading text-[16px] leading-tight text-[var(--soft-gray)]">{t.name}</p>
                    <p className="mt-1 text-[12px] text-[var(--soft-gray)]/55">{t.subtitle}</p>
                  </button>
                ))}
              </div>
            ) : (
              /* Lista de categorías */
              <div className="space-y-2">
                {TREATMENT_CATEGORIES.map((cat) => {
                  const count = TREATMENT_OPTIONS.filter((t) => t.category === cat).length;
                  return (
                    <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-[#1c1c1c] px-4 py-4 text-left hover:bg-[#222] transition-colors">
                      <div>
                        <p className="font-heading text-[20px] leading-none text-[var(--soft-gray)]">{cat}</p>
                        <p className="mt-1 text-[12px] text-[var(--soft-gray)]/55">{count} {count === 1 ? "tratamiento" : "tratamientos"}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--soft-gray)]/55" strokeWidth={1.8} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
