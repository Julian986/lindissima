"use client";

import { useEffect, useState } from "react";

function CrownLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 72"
      className="h-9 w-[4.5rem] text-[var(--premium-gold)]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 54L27 26L45 40L60 14L75 40L93 26L102 54"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M27 54H93"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle cx="27" cy="22" r="5" fill="currentColor" />
      <circle cx="60" cy="10" r="5.5" fill="currentColor" />
      <circle cx="93" cy="22" r="5" fill="currentColor" />
    </svg>
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
          backgroundImage: "url('/fondo_home.jpg')",
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
            <div className="text-[19px] font-medium tracking-[0.26em] text-white font-heading">
              LINDISSIMA
            </div>
            <div className="text-[10px] tracking-[0.28em] text-[var(--soft-gray)]/90">
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
              <button className="flex h-[52px] items-center justify-center rounded-full bg-[var(--premium-gold)] px-6 text-[16px] font-semibold tracking-[0.14em] text-[#1f1b16] shadow-[0_16px_36px_rgba(0,0,0,0.45)]">
                Reservar turno
              </button>
              <button className="flex h-[52px] items-center justify-center rounded-full border border-white/8 bg-black/45 px-6 text-[15px] font-medium tracking-[0.14em] text-white backdrop-blur-[10px]">
                Tratamientos
              </button>
              <button className="flex h-[52px] items-center justify-center rounded-full border border-white/8 bg-black/45 px-6 text-[15px] font-medium tracking-[0.14em] text-white backdrop-blur-[10px]">
                Promociones
              </button>
            </div>
          </section>

          <section className="mx-auto w-[84%] space-y-3">
            <button className="flex h-[52px] w-full items-center justify-center rounded-full border border-white/8 bg-black/45 px-6 text-[15px] font-medium tracking-[0.14em] text-white backdrop-blur-[10px]">
              Antes y después
            </button>
            <button className="flex h-[52px] w-full items-center justify-center rounded-full border border-white/8 bg-black/45 px-6 text-[15px] font-medium tracking-[0.14em] text-white backdrop-blur-[10px]">
              Contacto
            </button>
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
                <button className="flex h-10 items-center justify-center rounded-full bg-[var(--premium-gold)] px-5 text-[12px] font-semibold tracking-[0.14em] text-[#1f1b16]">
                  Reservar ahora
                </button>
                <span className="text-[10px] tracking-[0.08em] text-[var(--soft-gray)]/75">
                  Cupos limitados
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-center px-4 pb-4">
        <div className="flex w-full max-w-md items-center justify-between rounded-[28px] border border-white/8 bg-black/45 px-4 py-2.5 backdrop-blur-[16px]">
          <button className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="h-5 w-5 rounded-full bg-[var(--premium-gold)]" />
            <span className="text-[9px] tracking-[0.12em] text-[var(--premium-gold)]">
              Inicio
            </span>
          </button>
          <button className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <span className="h-5 w-5 rounded-full border border-zinc-500/80" />
            <span className="text-[9px] tracking-[0.12em]">
              Tratamientos
            </span>
          </button>
          <button className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <span className="h-5 w-5 rounded-full border border-zinc-500/80" />
            <span className="text-[9px] tracking-[0.12em]">
              Turnos
            </span>
          </button>
          <button className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <span className="h-5 w-5 rounded-full border border-zinc-500/80" />
            <span className="text-[9px] tracking-[0.12em]">
              Promos
            </span>
          </button>
          <button className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <span className="h-5 w-5 rounded-full border border-zinc-500/80" />
            <span className="text-[9px] tracking-[0.12em]">
              Perfil
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return <HomeContent />;
}
