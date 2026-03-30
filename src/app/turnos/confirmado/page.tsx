import { CalendarDays, CalendarPlus2, Home as HomeIcon, Percent, Sparkles, User } from "lucide-react";
import Link from "next/link";

function CrownLogo() {
  return (
    <img
      src="/corona%20svg.svg"
      alt=""
      aria-hidden="true"
      className="mx-auto h-14 w-28 object-contain"
    />
  );
}

type ConfirmPageProps = {
  searchParams?: Promise<{
    treatment?: string;
    subtitle?: string;
    date?: string;
    time?: string;
    name?: string;
    phone?: string;
    id?: string;
  }>;
};

export default async function TurnoConfirmadoPage({ searchParams }: ConfirmPageProps) {
  const params = (await searchParams) ?? {};
  const treatment = params.treatment ?? "Dermapen";
  const subtitle = params.subtitle ?? "Sesión premium";
  const date = params.date ?? "Jueves, 26 abr";
  const time = params.time ?? "15:00";
  const clientName = params.name ?? "";
  const clientPhone = params.phone ?? "";
  const reservationId = params.id ?? "";

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <main className="mx-auto w-full max-w-md px-4 pt-6 pb-24">
        <header className="mb-6 text-center">
          <CrownLogo />
        </header>

        <section className="rounded-[28px] border border-white/8 bg-[#171717] px-5 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
          <h1 className="text-[34px] leading-none font-heading text-[var(--premium-gold)]">
            ¡Reserva confirmada!
          </h1>
          <p className="mt-3 text-[16px] leading-relaxed text-[var(--soft-gray)]/88">
            Tu turno ha sido agendado con éxito.
          </p>
          {reservationId ? (
            <p className="mt-2 text-[11px] tracking-[0.06em] text-[var(--soft-gray)]/55">
              Referencia: <span className="font-mono text-[var(--soft-gray)]/75">{reservationId}</span>
            </p>
          ) : null}

          <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[33px] leading-none font-heading">{treatment}</h2>
                <p className="mt-2 text-[17px] text-[var(--soft-gray)]/86">
                  {date} · {time} hs
                </p>
                <p className="mt-1 text-[13px] tracking-[0.08em] text-[var(--soft-gray)]/58 uppercase">
                  {subtitle}
                </p>
                {(clientName || clientPhone) && (
                  <div className="mt-4 rounded-xl border border-white/8 bg-black/30 px-3 py-3 text-[13px] text-[var(--soft-gray)]/82">
                    {clientName ? <p className="font-medium text-[var(--soft-gray)]">{clientName}</p> : null}
                    {clientPhone ? (
                      <p className="mt-1 text-[var(--soft-gray)]/70">WhatsApp: {clientPhone}</p>
                    ) : null}
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-white/8 bg-black/25 p-2">
                <CalendarDays className="h-6 w-6 text-[var(--premium-gold)]" strokeWidth={1.7} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[13px]">
              <div className="rounded-xl border border-white/8 bg-[#1d1d1d] px-2 py-3">
                <p className="text-[var(--soft-gray)]/72">3 Sesiones</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-[#1d1d1d] px-2 py-3">
                <p className="text-[var(--soft-gray)]/72">10% OFF</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-[#1d1d1d] px-2 py-3">
                <p className="font-medium text-[var(--soft-gray)]">$33.000</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#b89253] to-[#e2cb9a] text-[19px] font-heading text-white"
          >
            <CalendarPlus2 className="h-5 w-5" strokeWidth={1.9} />
            Agregar al calendario
          </button>

          <div className="mt-5 grid grid-cols-1 gap-2">
<button
              type="button"
              className="flex h-12 items-center justify-center rounded-2xl border border-white/8 bg-black/18 text-[14px] text-[var(--soft-gray)]"
            >
              Reprogramar turno
            </button>
            <button
              type="button"
              className="flex h-12 items-center justify-center rounded-2xl border border-white/8 bg-black/18 text-[14px] text-[var(--soft-gray)]"
            >
              Cancelar turno
            </button>
          </div>

          <Link
            href="/turnos"
            className="mt-4 block text-center text-[13px] text-[var(--premium-gold)]/90"
          >
            Volver a la agenda
          </Link>
        </section>
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
    </div>
  );
}
