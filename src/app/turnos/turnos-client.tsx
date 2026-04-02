"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Home as HomeIcon,
  Percent,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TreatmentCategory = "Láser" | "Facial" | "Corporal";

type TreatmentOption = {
  id: string;
  name: string;
  subtitle: string;
  category: TreatmentCategory;
};

type CalendarItem = {
  value: string;
  dayNumber: number;
  weekday: string;
  isCurrentMonth: boolean;
  isAvailable: boolean;
};

const treatmentCategories: TreatmentCategory[] = ["Láser", "Facial", "Corporal"];

const treatmentOptions: TreatmentOption[] = [
  {
    id: "depilacion-laser",
    name: "Depilación Láser",
    subtitle: "Soprano Titanium · 4 ondas de profundidad",
    category: "Láser",
  },
  {
    id: "limpieza-facial-profunda",
    name: "Limpieza Facial Profunda",
    subtitle: "Higiene, extracción y renovación",
    category: "Facial",
  },
  {
    id: "dermapen",
    name: "Dermapen",
    subtitle: "Renovación y glow",
    category: "Facial",
  },
  {
    id: "exosomas",
    name: "Exosomas",
    subtitle: "Reparación intensiva",
    category: "Facial",
  },
  {
    id: "radiofrecuencia-facial",
    name: "Radiofrecuencia Facial",
    subtitle: "Reafirmación no invasiva",
    category: "Facial",
  },
  {
    id: "alta-frecuencia",
    name: "Alta Frecuencia",
    subtitle: "Oxigenación y equilibrio",
    category: "Facial",
  },
  {
    id: "electroporacion",
    name: "Electroporación",
    subtitle: "Vehiculización de activos",
    category: "Facial",
  },
  {
    id: "radiofrecuencia-corporal",
    name: "Radiofrecuencia Corporal",
    subtitle: "Reafirmación y tonicidad",
    category: "Corporal",
  },
  {
    id: "cavitacion",
    name: "Cavitación",
    subtitle: "Modelado corporal",
    category: "Corporal",
  },
  {
    id: "drenaje-linfatico",
    name: "Drenaje Linfático",
    subtitle: "Desinflamación y circulación",
    category: "Corporal",
  },
  {
    id: "maderoterapia",
    name: "Maderoterapia",
    subtitle: "Moldeado y firmeza",
    category: "Corporal",
  },
  {
    id: "masajes-reductores",
    name: "Masajes Reductores",
    subtitle: "Trabajo focalizado",
    category: "Corporal",
  },
  {
    id: "electroestimulador",
    name: "Electroestimulador",
    subtitle: "Tonificación muscular",
    category: "Corporal",
  },
  {
    id: "endermologie",
    name: "Endermologie",
    subtitle: "Estimulación mecánica",
    category: "Corporal",
  },
];

const availableTimesByWeekday: Record<number, string[]> = {
  1: ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00"],
  2: ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00"],
  3: ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00"],
  4: ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
  5: ["08:00", "09:00", "10:00", "11:00", "15:00", "16:00", "17:00"],
  6: ["08:00", "09:00", "10:00", "11:00", "12:00"],
};

/**
 * Excepciones manuales de disponibilidad (prioridad sobre la plantilla semanal).
 * Fuente: agenda enviada por la clienta para cierre de marzo / abril 2026.
 */
const availableTimesByDateOverride: Record<string, string[]> = {
  "2026-03-30": ["09:00", "16:30", "18:15"],
  "2026-03-31": ["10:00", "17:00", "18:00"],
  "2026-04-01": ["08:00", "10:00", "11:00", "12:00", "17:00"],
  "2026-04-04": ["09:00", "10:00", "11:00", "12:00"],
  "2026-04-07": ["10:00", "11:00", "15:00", "16:00", "17:30", "18:30"],
  "2026-04-08": ["08:00", "09:00", "10:00", "10:30", "15:00", "16:00"],
  "2026-04-09": ["08:00", "09:00", "10:00"],
  "2026-04-10": ["11:00", "15:00", "16:00", "17:30", "18:30"],
  "2026-04-11": ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"],
};

const weekdayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getAvailableTimesForDate(value: string) {
  const date = parseDateKey(value);
  const today = startOfDay(new Date());

  if (startOfDay(date) < today) {
    return [];
  }

  const override = availableTimesByDateOverride[value];
  if (override) {
    return override;
  }

  return availableTimesByWeekday[date.getDay()] ?? [];
}

function buildCalendarItems(year: number, monthIndex: number) {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const gridStartDate = new Date(year, monthIndex, 1 - startWeekday);

  return Array.from({ length: 35 }, (_, index) => {
    const currentDate = new Date(gridStartDate);
    currentDate.setDate(gridStartDate.getDate() + index);

    const value = formatDateKey(currentDate);

    return {
      value,
      dayNumber: currentDate.getDate(),
      weekday: weekdayLabels[currentDate.getDay()],
      isCurrentMonth: currentDate.getMonth() === monthIndex,
      isAvailable: getAvailableTimesForDate(value).length > 0,
    } satisfies CalendarItem;
  });
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "Elegí día";

  const date = new Date(year, month - 1, day);
  return `${weekdayLabels[date.getDay()]}, ${day} ${monthNames[month - 1].slice(0, 3).toLowerCase()}`;
}

function isLikelyWhatsappNumber(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

type TurnosClientProps = {
  initialTreatment?: string;
};

export default function TurnosClient({ initialTreatment = "" }: TurnosClientProps) {
  const initialMatch = treatmentOptions.find(
    (option) => option.id === initialTreatment || option.name === initialTreatment,
  );

  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>(initialMatch?.id ?? "");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [visibleMonthDate, setVisibleMonthDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [activeTreatmentCategory, setActiveTreatmentCategory] = useState<TreatmentCategory | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [treatmentFirstHintVisible, setTreatmentFirstHintVisible] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const bookingFocusRef = useRef<HTMLDivElement | null>(null);
  const dataSectionRef = useRef<HTMLDivElement | null>(null);
  const paymentSectionRef = useRef<HTMLElement | null>(null);
  const scrollPaymentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevDatosCompleteRef = useRef(false);

  const selectedTreatment = useMemo(
    () => treatmentOptions.find((option) => option.id === selectedTreatmentId),
    [selectedTreatmentId],
  );
  const visibleTreatments = useMemo(
    () =>
      activeTreatmentCategory
        ? treatmentOptions.filter((option) => option.category === activeTreatmentCategory)
        : [],
    [activeTreatmentCategory],
  );
  const calendarItems = useMemo(
    () => buildCalendarItems(visibleMonthDate.getFullYear(), visibleMonthDate.getMonth()),
    [visibleMonthDate],
  );
  const visibleMonthLabel = `${monthNames[visibleMonthDate.getMonth()]} ${visibleMonthDate.getFullYear()}`;

  const availableTimes = selectedDate ? getAvailableTimesForDate(selectedDate) : [];
  const hasSlot = Boolean(selectedTreatment && selectedDate && selectedTime);
  const datosComplete = Boolean(
    customerName.trim().length >= 2 &&
      isLikelyWhatsappNumber(customerPhone) &&
      whatsappOptIn,
  );
  const showWhatsappInvalidHint =
    customerPhone.trim().length >= 8 && !isLikelyWhatsappNumber(customerPhone);
  const activeStep = !selectedTreatment
    ? 1
    : !selectedDate
      ? 2
      : !selectedTime
        ? 3
        : !datosComplete
          ? 4
          : 5;

  useEffect(() => {
    if (selectedTreatment) setTreatmentFirstHintVisible(false);
  }, [selectedTreatment]);

  useEffect(() => {
    if (!treatmentFirstHintVisible) return;
    const t = window.setTimeout(() => setTreatmentFirstHintVisible(false), 4500);
    return () => clearTimeout(t);
  }, [treatmentFirstHintVisible]);

  useEffect(() => {
    prevDatosCompleteRef.current = false;
  }, [selectedTreatmentId, selectedDate, selectedTime]);

  const scheduleScrollToPaymentSection = useCallback(() => {
    if (!hasSlot) return;
    if (scrollPaymentTimeoutRef.current) clearTimeout(scrollPaymentTimeoutRef.current);
    scrollPaymentTimeoutRef.current = setTimeout(() => {
      scrollPaymentTimeoutRef.current = null;
      paymentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 180);
  }, [hasSlot]);

  useEffect(() => {
    return () => {
      if (scrollPaymentTimeoutRef.current) clearTimeout(scrollPaymentTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hasSlot) {
      prevDatosCompleteRef.current = datosComplete;
      return;
    }
    const becameComplete = datosComplete && !prevDatosCompleteRef.current;
    prevDatosCompleteRef.current = datosComplete;
    if (becameComplete) scheduleScrollToPaymentSection();
  }, [datosComplete, hasSlot, scheduleScrollToPaymentSection]);

  useEffect(() => {
    if (!hasSlot) return;
    const id = requestAnimationFrame(() => {
      dataSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(id);
  }, [hasSlot, selectedTime]);

  const handleMercadoPagoCheckout = async () => {
    if (!selectedTreatment || !selectedDate || !selectedTime || !datosComplete) {
      return;
    }
    setConfirmError(null);
    setCheckoutLoading(true);
    try {
      const pendingBody = {
        treatmentId: selectedTreatment.id,
        treatmentName: selectedTreatment.name,
        subtitle: selectedTreatment.subtitle,
        category: selectedTreatment.category,
        dateKey: selectedDate,
        timeLocal: selectedTime,
        displayDate: formatDisplayDate(selectedDate),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        whatsappOptIn,
      };
      const resPending = await fetch("/api/reservations/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingBody),
      });
      const dataPending = (await resPending.json()) as {
        error?: string;
        id?: string;
        checkoutToken?: string;
      };
      if (!resPending.ok) {
        setConfirmError(dataPending.error ?? "No se pudo reservar el turno.");
        return;
      }
      if (!dataPending.id || !dataPending.checkoutToken) {
        setConfirmError("Respuesta inválida del servidor.");
        return;
      }

      const resPref = await fetch("/api/mercadopago/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: dataPending.id,
          checkoutToken: dataPending.checkoutToken,
        }),
      });
      const dataPref = (await resPref.json()) as { error?: string; initPoint?: string };
      if (!resPref.ok) {
        setConfirmError(dataPref.error ?? "No se pudo iniciar Mercado Pago.");
        return;
      }
      if (!dataPref.initPoint) {
        setConfirmError("Mercado Pago no devolvió el enlace de pago.");
        return;
      }

      const snapshot = {
        treatment: selectedTreatment.name,
        subtitle: selectedTreatment.subtitle,
        date: formatDisplayDate(selectedDate),
        time: selectedTime,
        name: customerName.trim(),
        phone: customerPhone.trim(),
        id: dataPending.id,
      };
      sessionStorage.setItem("mp_turno_snapshot", JSON.stringify(snapshot));
      window.location.href = dataPref.initPoint;
    } catch {
      setConfirmError("Sin conexión o error de red. Probá de nuevo.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const openTreatmentModal = () => {
    setActiveTreatmentCategory(selectedTreatment?.category ?? null);
    setIsTreatmentModalOpen(true);
  };

  const closeTreatmentModal = () => {
    setIsTreatmentModalOpen(false);
    setActiveTreatmentCategory(null);
  };

  const selectTreatment = (treatmentId: string) => {
    setSelectedTreatmentId(treatmentId);
    closeTreatmentModal();
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <main className="mx-auto w-full max-w-md px-4 pt-6 pb-24">
        <header className="mb-5 flex items-center justify-between">
          <Link href="/" aria-label="Volver a inicio" className="text-[var(--soft-gray)]/88">
            <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <h1 className="text-[30px] leading-none font-heading">Reservar turno</h1>
          <span className="h-5 w-5" />
        </header>

        <section className="space-y-2">
          <button
            type="button"
            onClick={openTreatmentModal}
            className={`flex w-full items-center justify-between rounded-2xl border bg-[#171717] px-4 py-3 text-left transition-all ${
              activeStep === 1
                ? "border-[var(--premium-gold)] shadow-[0_0_0_1px_rgba(201,169,106,0.2),0_0_22px_rgba(201,169,106,0.16)]"
                : "border-white/8"
            }`}
          >
            <div>
              <p className="text-[11px] tracking-[0.14em] text-[var(--soft-gray)]/55">Paso 1</p>
              <p className="mt-1 text-[14px] text-[var(--soft-gray)]">
                {selectedTreatment ? selectedTreatment.name : "Elegí tratamiento"}
              </p>
              {selectedTreatment && (
                <p className="mt-1 text-[11px] text-[var(--soft-gray)]/55">
                  {selectedTreatment.category} · {selectedTreatment.subtitle}
                </p>
              )}
              {activeStep === 1 && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--premium-gold)]/92">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--premium-gold)]" />
                  <span>Comenzá seleccionando el servicio</span>
                </div>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--soft-gray)]/60" strokeWidth={1.8} />
          </button>

          <div
            className={`flex items-center justify-between rounded-2xl border bg-[#171717] px-4 py-3 transition-all ${
              activeStep === 2
                ? "border-[var(--premium-gold)] shadow-[0_0_0_1px_rgba(201,169,106,0.2),0_0_22px_rgba(201,169,106,0.16)]"
                : "border-white/8"
            }`}
          >
            <div>
              <p className="text-[11px] tracking-[0.14em] text-[var(--soft-gray)]/55">Paso 2</p>
              <p className="mt-1 text-[14px] text-[var(--soft-gray)]">
                {selectedDate ? formatDisplayDate(selectedDate) : "Elegí día"}
              </p>
              {activeStep === 2 && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--premium-gold)]/92">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--premium-gold)]" />
                  <span>Ahora elegí una fecha disponible</span>
                </div>
              )}
            </div>
            <ChevronRight className="h-4 w-4 rotate-90 text-[var(--soft-gray)]/60" strokeWidth={1.8} />
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-[24px] border border-white/8 bg-[#e4c48f] p-3 text-[#2c241b] shadow-[0_12px_26px_rgba(0,0,0,0.36)]">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setVisibleMonthDate(
                  (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
                )
              }
              className="text-[#7f6a45]"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <h2 className="text-[18px] leading-none font-heading">{visibleMonthLabel}</h2>
            <button
              type="button"
              onClick={() =>
                setVisibleMonthDate(
                  (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
                )
              }
              className="text-[#7f6a45]"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>

          {treatmentFirstHintVisible ? (
            <p
              role="status"
              aria-live="polite"
              className="mb-2 rounded-xl border border-[#8a7548]/55 bg-[#fff9ec]/97 px-3 py-2.5 text-center text-[12px] leading-snug text-[#2c241b] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
            >
              <span className="font-semibold">Primero elegí un tratamiento</span>
              <span className="text-[#3b3224]"> (paso 1) para poder elegir el día.</span>
            </p>
          ) : null}

          <div className="grid grid-cols-7 gap-y-2 text-center">
            {weekdayLabels.map((label) => (
              <div key={label} className="text-[10px] tracking-[0.08em] text-[#7f7364]">
                {label}
              </div>
            ))}
            {calendarItems.map((day) => {
              const isSelected = day.value === selectedDate;
              const isDisabled = !day.isCurrentMonth || !day.isAvailable;

              return (
                <button
                  key={day.value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (!selectedTreatment) {
                      setTreatmentFirstHintVisible(true);
                      return;
                    }
                    setSelectedDate(day.value);
                    setSelectedTime("");
                    requestAnimationFrame(() => {
                      bookingFocusRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    });
                  }}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-[12px] transition-colors ${
                    isSelected
                      ? "bg-[#1a1a1a] text-[#c89b56] shadow-[0_6px_14px_rgba(0,0,0,0.25)]"
                      : !day.isCurrentMonth
                        ? "text-[#cfbea8]/45"
                        : day.isAvailable
                          ? "bg-[#eed7ae] text-[#3b2f22]"
                          : "text-[#897a67]"
                  }`}
                >
                  {day.dayNumber}
                </button>
              );
            })}
          </div>
        </section>

        <div ref={bookingFocusRef} className="mt-4">
        <section>
          <div
            className={`flex items-center justify-between rounded-2xl border bg-[#171717] px-4 py-3 transition-all ${
              activeStep === 3
                ? "border-[var(--premium-gold)] shadow-[0_0_0_1px_rgba(201,169,106,0.2),0_0_22px_rgba(201,169,106,0.16)]"
                : "border-white/8"
            }`}
          >
            <div>
              <p className="text-[11px] tracking-[0.14em] text-[var(--soft-gray)]/55">Paso 3</p>
              <p className="mt-1 text-[14px] text-[var(--soft-gray)]">
                {selectedTime ? `Horario elegido: ${selectedTime}` : "Elegí horario"}
              </p>
              {activeStep === 3 && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--premium-gold)]/92">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--premium-gold)]" />
                  <span>Seleccioná un horario para continuar</span>
                </div>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--soft-gray)]/60" strokeWidth={1.8} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {availableTimes.length > 0 ? (
              availableTimes.map((time) => {
                const isActive = time === selectedTime;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`h-11 rounded-xl border text-[16px] transition-colors ${
                      isActive
                        ? "border-[var(--premium-gold)] bg-[#2a2318] text-[var(--premium-gold)]"
                        : "border-white/8 bg-[#151515] text-[var(--soft-gray)]"
                    }`}
                  >
                    {time}
                  </button>
                );
              })
            ) : (
              <div className="col-span-2 rounded-2xl border border-white/8 bg-[#171717] px-4 py-5 text-center text-[13px] text-[var(--soft-gray)]/68">
                Elegí un día disponible para ver los horarios.
              </div>
            )}
          </div>
        </section>

        {hasSlot && (
          <div ref={dataSectionRef} className="mt-6 space-y-5">
            <section
              className={`rounded-2xl border bg-[#171717] px-4 py-4 transition-all ${
                activeStep === 4
                  ? "border-[var(--premium-gold)] shadow-[0_0_0_1px_rgba(201,169,106,0.2),0_0_22px_rgba(201,169,106,0.16)]"
                  : "border-white/8"
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] tracking-[0.14em] text-[var(--soft-gray)]/55">Paso 4</p>
                  <p className="mt-1 text-[18px] font-heading text-[var(--soft-gray)]">Tus datos</p>
                  <p className="mt-1 text-[12px] text-[var(--soft-gray)]/58">
                    Completá tu nombre y WhatsApp para recordatorios.
                  </p>
                  {activeStep === 4 && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--premium-gold)]/92">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--premium-gold)]" />
                      <span>Necesitamos estos datos antes del pago</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label htmlFor="customerName" className="text-[11px] tracking-[0.12em] text-[var(--soft-gray)]/55">
                    Nombre y apellido
                  </label>
                  <input
                    id="customerName"
                    name="customerName"
                    autoComplete="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Como figura en tu DNI o preferís que te llamemos"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-3 text-[15px] text-[var(--soft-gray)] outline-none placeholder:text-[var(--soft-gray)]/35 focus:border-[var(--premium-gold)]/55"
                  />
                </div>
                <div>
                  <label htmlFor="customerPhone" className="text-[11px] tracking-[0.12em] text-[var(--soft-gray)]/55">
                    WhatsApp
                  </label>
                  <input
                    id="customerPhone"
                    name="customerPhone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    onBlur={() => {
                      const nameOk = customerName.trim().length >= 2;
                      const phoneOk = isLikelyWhatsappNumber(customerPhone);
                      if (hasSlot && nameOk && phoneOk && whatsappOptIn) {
                        scheduleScrollToPaymentSection();
                      }
                    }}
                    placeholder="Ej: +54 9 11 2345-6789"
                    aria-invalid={showWhatsappInvalidHint}
                    className={`mt-1.5 w-full rounded-xl border bg-[#141414] px-3 py-3 text-[15px] text-[var(--soft-gray)] outline-none placeholder:text-[var(--soft-gray)]/35 focus:border-[var(--premium-gold)]/55 ${
                      showWhatsappInvalidHint
                        ? "border-amber-500/45"
                        : "border-white/10"
                    }`}
                  />
                  <p className="mt-1 text-[11px] text-[var(--soft-gray)]/45">
                    Mismo número que usás en WhatsApp.
                  </p>
                  {showWhatsappInvalidHint ? (
                    <p className="mt-1 text-[11px] leading-snug text-amber-200/90">
                      Revisá el número: tiene que tener entre 10 y 15 dígitos en total (podés usar +54,
                      espacios o guiones).
                    </p>
                  ) : null}
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-black/20 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={whatsappOptIn}
                    onChange={(e) => setWhatsappOptIn(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 accent-[var(--premium-gold)]"
                  />
                  <span className="text-[12px] leading-snug text-[var(--soft-gray)]/78">
                    Acepto recibir recordatorios y avisos de mi turno por WhatsApp.
                  </span>
                </label>
              </div>
            </section>

            <section
              ref={paymentSectionRef}
              className={`rounded-2xl border bg-[#171717] px-4 py-4 transition-all ${
                activeStep === 5
                  ? "border-[var(--premium-gold)] shadow-[0_0_0_1px_rgba(201,169,106,0.2),0_0_22px_rgba(201,169,106,0.16)]"
                  : "border-white/8"
              }`}
            >
              <p className="text-[11px] tracking-[0.14em] text-[var(--soft-gray)]/55">Paso 5</p>
              <p className="mt-1 text-[18px] font-heading text-[var(--soft-gray)]">Seña con Mercado Pago</p>
              <p className="mt-1 text-[12px] text-[var(--soft-gray)]/58">
                Reservá el horario abonando la seña. Monto y política la define la clínica.
              </p>
              {activeStep === 5 && datosComplete && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--premium-gold)]/92">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--premium-gold)]" />
                  <span>Pagá la seña: te llevamos a Mercado Pago</span>
                </div>
              )}
              <p className="mt-3 text-[11px] leading-snug text-[var(--soft-gray)]/50">
                El turno se confirma cuando Mercado Pago acredita el pago (no al volver del navegador).
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  disabled={!datosComplete || checkoutLoading}
                  onClick={() => void handleMercadoPagoCheckout()}
                  className={`flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl text-[16px] font-semibold transition-all ${
                    datosComplete && !checkoutLoading
                      ? "bg-[#009EE3] text-white shadow-[0_8px_24px_rgba(0,158,227,0.35)]"
                      : "cursor-not-allowed bg-[#2a2a2a] text-white/40"
                  } ${checkoutLoading ? "cursor-wait" : ""}`}
                >
                  <img
                    src="/Mercado_Pago_idp_LvMgpe_1.svg"
                    alt=""
                    className={`h-8 w-auto shrink-0 object-contain sm:h-9 ${
                      datosComplete && !checkoutLoading ? "opacity-100" : "opacity-45"
                    }`}
                    width={39}
                    height={28}
                    decoding="async"
                  />
                  <span className="text-[13px] font-medium opacity-95">
                    {checkoutLoading ? "Preparando pago…" : "Pagar seña con Mercado Pago"}
                  </span>
                </button>
              </div>
              {confirmError ? (
                <p
                  role="alert"
                  className="mt-3 rounded-xl border border-red-500/35 bg-red-950/35 px-3 py-2.5 text-center text-[12px] leading-snug text-red-200/95"
                >
                  {confirmError}
                </p>
              ) : null}
            </section>
          </div>
        )}

        </div>
      </main>

      <nav className="fixed right-0 bottom-0 left-0 z-30">
        <div className="flex w-full items-center justify-between border-t border-white/8 bg-black/60 px-4 py-2.5 backdrop-blur-[16px]">
          <Link href="/" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <HomeIcon className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.9} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">Inicio</span>
          </Link>
          <Link href="/tratamientos" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <Sparkles className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">Tratamientos</span>
          </Link>
          <Link href="/turnos" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <CalendarDays className="h-5 w-5 text-[var(--premium-gold)]" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--premium-gold)]">Turnos</span>
          </Link>
          <Link href="/promociones" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <Percent className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">Promos</span>
          </Link>
          <Link href="/perfil" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <User className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">Perfil</span>
          </Link>
        </div>
      </nav>

      {isTreatmentModalOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/60 backdrop-blur-[3px]">
          <button
            type="button"
            aria-label="Cerrar selector de tratamiento"
            onClick={closeTreatmentModal}
            className="absolute inset-0"
          />

          <div className="relative w-full rounded-t-[32px] border-t border-white/8 bg-[#161616] px-4 pt-3 pb-6 shadow-[0_-18px_40px_rgba(0,0,0,0.45)]">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/12" />

            <div className="mb-4 flex items-center justify-between">
              {activeTreatmentCategory ? (
                <button
                  type="button"
                  onClick={() => setActiveTreatmentCategory(null)}
                  className="text-[var(--soft-gray)]/75"
                  aria-label="Volver a categorías"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
                </button>
              ) : (
                <span className="h-5 w-5" />
              )}

              <h2 className="text-[26px] leading-none font-heading">
                {activeTreatmentCategory ?? "Elegí tratamiento"}
              </h2>

              <button
                type="button"
                onClick={closeTreatmentModal}
                className="text-[13px] text-[var(--soft-gray)]/75"
              >
                Cerrar
              </button>
            </div>

            {activeTreatmentCategory ? (
              <div className="max-h-[52vh] space-y-2 overflow-y-auto pb-2">
                {visibleTreatments.map((treatment) => {
                  const isSelected = treatment.id === selectedTreatmentId;

                  return (
                    <button
                      key={treatment.id}
                      type="button"
                      onClick={() => selectTreatment(treatment.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? "border-[var(--premium-gold)] bg-[#241d12]"
                          : "border-white/8 bg-[#1c1c1c]"
                      }`}
                    >
                      <p className="text-[16px] leading-tight font-heading text-[var(--soft-gray)]">
                        {treatment.name}
                      </p>
                      <p className="mt-1 text-[12px] text-[var(--soft-gray)]/58">
                        {treatment.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {treatmentCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveTreatmentCategory(category)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-[#1c1c1c] px-4 py-4 text-left"
                  >
                    <div>
                      <p className="text-[20px] leading-none font-heading text-[var(--soft-gray)]">
                        {category}
                      </p>
                      <p className="mt-1 text-[12px] text-[var(--soft-gray)]/58">
                        {treatmentOptions.filter((option) => option.category === category).length} tratamientos
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--soft-gray)]/55" strokeWidth={1.8} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

