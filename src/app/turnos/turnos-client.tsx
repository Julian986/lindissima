"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Home as HomeIcon, Percent, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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

type TurnosClientProps = {
  initialTreatment?: string;
};

export default function TurnosClient({ initialTreatment = "" }: TurnosClientProps) {
  const router = useRouter();
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
  const canConfirm = Boolean(selectedTreatment && selectedDate && selectedTime);
  const activeStep = !selectedTreatment ? 1 : !selectedDate ? 2 : !selectedTime ? 3 : 4;

  const handleConfirm = () => {
    if (!selectedTreatment || !selectedDate || !selectedTime) return;
    const params = new URLSearchParams({
      treatment: selectedTreatment.name,
      subtitle: selectedTreatment.subtitle,
      date: formatDisplayDate(selectedDate),
      time: selectedTime,
    });

    router.push(`/turnos/confirmado?${params.toString()}`);
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
                    setSelectedDate(day.value);
                    setSelectedTime("");
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

        <section className="mt-4">
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

        <div className="mt-5">
          {activeStep === 4 && (
            <div className="mb-2 flex items-center justify-center gap-2 text-[11px] text-[var(--premium-gold)]/92">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--premium-gold)]" />
              <span>Ya podés confirmar tu turno</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`h-[52px] w-full rounded-full border text-[18px] font-heading transition-all ${
              canConfirm
                ? activeStep === 4
                  ? "border-[#e2cb9a] bg-gradient-to-r from-[#b89253] to-[#e2cb9a] text-white shadow-[0_0_0_1px_rgba(226,203,154,0.2),0_0_24px_rgba(201,169,106,0.22)]"
                  : "border-transparent bg-gradient-to-r from-[#b89253] to-[#e2cb9a] text-white"
                : "border-transparent bg-[#3a3328] text-white/45"
            }`}
          >
            Confirmar
          </button>
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
