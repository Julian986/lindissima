import { CalendarDays, CalendarPlus2, Home as HomeIcon, Percent, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { ConfirmadoIrPerfilButton } from "@/components/confirmado-ir-perfil-button";

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

export default async function TurnoConfirmadoPage({ searchParams }: ConfirmPageProps) {
  const params = (await searchParams) ?? {};
  const treatment = params.treatment ?? "Tratamiento";
  const subtitle = params.subtitle ?? "";
  const date = params.date ?? "";
  const time = params.time ?? "";
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
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/18">
              <span className="text-[22px]">✓</span>
            </span>
            <h1 className="font-heading text-[30px] leading-none text-[var(--premium-gold)]">
              ¡Reserva confirmada!
            </h1>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--soft-gray)]/88">
            Tu turno ha sido agendado con éxito. Te esperamos puntual.
          </p>
          {reservationId ? (
            <p className="mt-2 text-[11px] tracking-[0.06em] text-[var(--soft-gray)]/45">
              Ref: <span className="font-mono text-[var(--soft-gray)]/62">{reservationId}</span>
            </p>
          ) : null}

          <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-[28px] leading-none text-[var(--soft-gray)]">{treatment}</h2>
                {subtitle ? (
                  <p className="mt-1.5 text-[11px] tracking-[0.08em] text-[var(--soft-gray)]/55 uppercase">{subtitle}</p>
                ) : null}
                {date || time ? (
                  <p className="mt-3 text-[16px] font-semibold text-[var(--soft-gray)]/90">
                    {date}{date && time ? " · " : ""}{time ? `${time} hs` : ""}
                  </p>
                ) : null}
                {(clientName || clientPhone) ? (
                  <div className="mt-4 rounded-xl border border-white/8 bg-black/30 px-3 py-3 text-[13px]">
                    {clientName ? <p className="font-medium text-[var(--soft-gray)]">{clientName}</p> : null}
                    {clientPhone ? (
                      <p className="mt-1 text-[var(--soft-gray)]/65">WhatsApp: {clientPhone}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="rounded-xl border border-white/8 bg-black/25 p-2.5 shrink-0">
                <CalendarDays className="h-6 w-6 text-[var(--premium-gold)]" strokeWidth={1.7} />
              </div>
            </div>
          </div>

          <ConfirmadoIrPerfilButton phone={clientPhone} />

          <div className="mt-3 grid grid-cols-1 gap-2">
            <Link
              href="/turnos"
              className="flex h-11 items-center justify-center rounded-2xl border border-white/8 bg-black/18 text-[13px] text-[var(--soft-gray)]/75 transition hover:bg-white/5"
            >
              Reservar otro turno
            </Link>
          </div>
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
