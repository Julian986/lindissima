"use client";

import { CalendarDays, Home as HomeIcon, Percent, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Snapshot = {
  treatment?: string;
  subtitle?: string;
  date?: string;
  time?: string;
  name?: string;
  phone?: string;
  id?: string;
};

function PagoRetornoContent() {
  const searchParams = useSearchParams();
  const estado = searchParams.get("estado") ?? "";
  const [snap, setSnap] = useState<Snapshot | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("mp_turno_snapshot");
      if (raw) setSnap(JSON.parse(raw) as Snapshot);
    } catch {
      setSnap(null);
    }
  }, []);

  const title =
    estado === "success"
      ? "Pago recibido"
      : estado === "failure"
        ? "Pago no completado"
        : estado === "pending"
          ? "Pago pendiente"
          : "Volviste de Mercado Pago";

  const body =
    estado === "success"
      ? "Si Mercado Pago acreditó el pago, tu turno quedará confirmado en breve. La confirmación la procesa el sistema automáticamente (no depende de esta pantalla)."
      : estado === "failure"
        ? "No se completó el cobro. Podés volver a Turnos, elegir el mismo horario si sigue libre, e intentar de nuevo."
        : estado === "pending"
          ? "El pago puede estar en revisión. Cuando Mercado Pago lo apruebe, tu turno se confirmará solo."
          : "Esta pantalla es solo informativa. El estado real del pago lo confirma Mercado Pago por notificación al servidor.";

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <main className="mx-auto w-full max-w-md px-4 pt-6 pb-24">
        <header className="mb-6 text-center">
          <h1 className="text-[30px] leading-none font-heading text-[var(--premium-gold)]">{title}</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--soft-gray)]/88">{body}</p>
        </header>

        {snap?.treatment ? (
          <section className="mb-6 rounded-2xl border border-white/8 bg-[#171717] px-4 py-4 text-[14px] text-[var(--soft-gray)]/88">
            <p className="font-heading text-[20px] text-[var(--soft-gray)]">{snap.treatment}</p>
            {snap.date ? (
              <p className="mt-1">
                {snap.date}
                {snap.time ? ` · ${snap.time} hs` : ""}
              </p>
            ) : null}
            {snap.id ? (
              <p className="mt-3 text-[11px] tracking-[0.06em] text-[var(--soft-gray)]/55">
                Referencia reserva: <span className="font-mono text-[var(--soft-gray)]/75">{snap.id}</span>
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="flex flex-col gap-3">
          <Link
            href="/turnos"
            className="flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#b89253] to-[#e2cb9a] text-[16px] font-heading text-white"
          >
            Volver a Turnos
          </Link>
          <Link href="/" className="block text-center text-[14px] text-[var(--premium-gold)]/90">
            Ir al inicio
          </Link>
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
    </div>
  );
}

export default function PagoRetornoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#111111] text-[var(--soft-gray)]">
          Cargando…
        </div>
      }
    >
      <PagoRetornoContent />
    </Suspense>
  );
}
