"use client";

import { CalendarDays, Home as HomeIcon, Percent, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

let hasShownHomeSplash = false;

function CrownLogo() {
  return (
    <img
      src="/corona%20svg.svg"
      alt=""
      aria-hidden="true"
      className="h-9 w-[4.5rem] object-contain"
    />
  );
}

function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#111111] text-white">
      <div className="flex w-full max-w-md flex-col items-center px-6">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex flex-col items-center gap-2">
            <CrownLogo />
            <div className="text-3xl font-medium tracking-[0.25em] font-heading">
              LINDISSIMA
            </div>
            <div className="text-xs tracking-[0.25em] text-[var(--soft-gray)]/80">
              Láser & Treatments
            </div>
          </div>
        </div>

        {/* Frase */}
        <p className="max-w-xs text-center text-sm leading-relaxed text-[var(--soft-gray)]">
          Tecnología estética avanzada para cuidar y realzar tu belleza natural.
        </p>
      </div>
    </div>
  );
}

function HomeContent() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#111111] text-white">
      {/* Fondo fijo de la pantalla */}
      <div
        className="fixed top-0 right-0 left-0 z-0"
        style={{
          height: "100svh",
          backgroundImage:
            "url('https://res.cloudinary.com/dzoupwn0e/image/upload/v1773419875/fondo_home_3_q3kumw.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center 28%",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Overlay para lectura */}
      <div
        className="fixed top-0 right-0 left-0 z-10"
        style={{
          height: "100svh",
          backgroundImage:
            "linear-gradient(to bottom, rgba(17,17,17,0.98) 0%, rgba(17,17,17,0.88) 16%, rgba(17,17,17,0.48) 38%, rgba(17,17,17,0.22) 54%, rgba(17,17,17,0.62) 68%, rgba(17,17,17,0.94) 84%, rgba(17,17,17,1) 100%)",
        }}
      />

      <main className="relative z-20 mx-auto min-h-screen w-full max-w-md px-5 pt-20 pb-28">
        <header className="flex justify-center">
          <div className="inline-flex flex-col items-center gap-1 text-center">
            <CrownLogo />
            <div className="text-[28px] font-medium tracking-[0.26em] text-white font-heading">
              LINDISSIMA
            </div>
            <div className="text-[11px] tracking-[0.28em] text-[var(--soft-gray)]/90">
              Láser & Treatments
            </div>
          </div>
        </header>

        <div className="mt-[31vh] space-y-4">
          <section className="pb-1">
            <h1 className="mx-auto mb-6 text-center text-[26px] font-normal leading-[1.28] text-white font-heading">
              Belleza, tecnología
              <br />
              <span className="whitespace-nowrap">y cuidado profesional</span>
            </h1>
            <div className="mx-auto flex w-[84%] flex-col gap-3">
              <Link
                href="/turnos"
                className="flex h-[52px] items-center justify-center rounded-full bg-[var(--premium-gold)] px-6 text-[16px] font-semibold tracking-[0.14em] text-[#1f1b16] shadow-[0_16px_36px_rgba(0,0,0,0.45)]"
              >
                Reservar turno
              </Link>
              <Link
                href="/tratamientos"
                className="flex h-[52px] items-center justify-center rounded-full border border-white/8 bg-black/45 px-6 text-[15px] font-medium tracking-[0.14em] text-white backdrop-blur-[10px]"
              >
                Tratamientos
              </Link>
              <Link
                href="/promociones"
                className="flex h-[52px] items-center justify-center rounded-full border border-white/8 bg-black/45 px-6 text-[15px] font-medium tracking-[0.14em] text-white backdrop-blur-[10px]"
              >
                Promociones
              </Link>
            </div>
          </section>

          <section className="mx-auto w-[84%] space-y-3">
            <Link
              href="/antes-y-despues"
              className="flex h-[52px] w-full items-center justify-center rounded-full border border-white/8 bg-black/45 px-6 text-[15px] font-medium tracking-[0.14em] text-white backdrop-blur-[10px]"
            >
              Antes y después
            </Link>
            <Link
              href="/tips-de-lumi"
              className="flex h-[52px] w-full items-center justify-center rounded-full border border-white/8 bg-black/45 px-6 text-[15px] font-medium tracking-[0.14em] text-white backdrop-blur-[10px]"
            >
              Tips de Lumi
            </Link>
            <Link
              href="/contacto"
              className="flex h-[52px] w-full items-center justify-center rounded-full border border-white/8 bg-black/45 px-6 text-[15px] font-medium tracking-[0.14em] text-white backdrop-blur-[10px]"
            >
              Contacto
            </Link>
          </section>

          <section className="mx-auto w-[84%]">
            <div className="mb-3 text-[10px] tracking-[0.24em] text-[var(--soft-gray)]/70">
              PROMOCION DESTACADA DEL MES
            </div>
            <div className="rounded-[28px] border border-white/8 bg-black/50 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.4)] backdrop-blur-[14px]">
              <div className="text-[10px] tracking-[0.24em] text-[var(--premium-gold)]">
                GLOW FACIAL
              </div>
              <h2 className="mt-2 text-lg leading-tight text-white font-heading">
                Limpieza profunda + Dermapen
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[var(--soft-gray)]">
                Lográ una piel luminosa, uniforme y libre de impurezas.
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <Link
                  href="/turnos?treatment=Limpieza%20Facial"
                  className="flex h-10 items-center justify-center rounded-full bg-[var(--premium-gold)] px-5 text-[12px] font-semibold tracking-[0.14em] text-[#1f1b16]"
                >
                  Reservar ahora
                </Link>
                <span className="text-[10px] tracking-[0.08em] text-[var(--soft-gray)]/75">
                  Cupos limitados
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30">
        <div className="flex w-full items-center justify-between border-t border-white/8 bg-black/60 px-4 py-2.5 backdrop-blur-[16px]">
          <button className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <HomeIcon className="h-5 w-5 text-[var(--premium-gold)]" strokeWidth={1.9} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--premium-gold)]">
              Inicio
            </span>
          </button>
          <Link href="/tratamientos" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <Sparkles className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">
              Tratamientos
            </span>
          </Link>
          <Link href="/turnos" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <CalendarDays className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">
              Turnos
            </span>
          </Link>
          <Link href="/promociones" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <Percent className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">
              Promos
            </span>
          </Link>
          <Link href="/perfil" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <User className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(!hasShownHomeSplash);

  useEffect(() => {
    if (hasShownHomeSplash) {
      setShowSplash(false);
      return;
    }

    const timeout = setTimeout(() => {
      hasShownHomeSplash = true;
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return <HomeContent />;
}
