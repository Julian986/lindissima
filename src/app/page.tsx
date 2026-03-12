"use client";

import { useEffect, useState } from "react";

function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#111111] text-white">
      <div className="flex w-full max-w-md flex-col items-center px-6">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex flex-col items-center gap-1">
            <div className="text-3xl font-semibold tracking-[0.25em]">
              LINDISSIMA
            </div>
            <div className="text-xs uppercase tracking-[0.25em] text-zinc-400">
              Láser & Treatments
            </div>
          </div>
        </div>

        {/* Frase */}
        <p className="max-w-xs text-center text-sm leading-relaxed text-zinc-300">
          Tecnología estética avanzada para cuidar y realzar tu belleza natural.
        </p>
      </div>
    </div>
  );
}

function HomeContent() {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden text-white">
      {/* Capa de imagen de fondo */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: "url('/fondo_home.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 35%",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Capa de overlay oscuro */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      <main className="relative z-10 flex w-full max-w-md flex-1 flex-col px-5 pt-6 pb-24">
        {/* Header pequeño con logo */}
        <header className="mb-10 flex justify-center">
          <div className="inline-flex flex-col items-center gap-1">
            <div className="h-7 w-7 rounded-full border border-[#C9A96A]/60 bg-gradient-to-b from-[#e7d1a0] to-[#C9A96A]" />
            <div className="mt-1 text-[18px] font-semibold tracking-[0.28em] font-heading">
              LINDISSIMA
            </div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-400">
              Láser & Treatments
            </div>
          </div>
        </header>

        {/* Copy principal y CTAs sobre el fondo */}
        <section className="mt-auto mb-6">
          <h1 className="mb-4 text-center text-[22px] font-semibold leading-snug text-white font-heading">
            Belleza, tecnología y cuidado profesional
          </h1>
          <div className="space-y-2">
            <button className="flex w-full items-center justify-center rounded-full bg-[#C9A96A] px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-black shadow-[0_16px_40px_rgba(0,0,0,0.75)] transition-transform hover:scale-[1.02]">
              Reservar turno
            </button>
            <button className="flex w-full items-center justify-center rounded-full bg-black/60 px-6 py-3 text-[13px] font-medium uppercase tracking-[0.16em] text-white ring-1 ring-zinc-700/80">
              Tratamientos
            </button>
            <button className="flex w-full items-center justify-center rounded-full bg-black/60 px-6 py-3 text-[13px] font-medium uppercase tracking-[0.16em] text-white ring-1 ring-zinc-700/80">
              Promociones
            </button>
          </div>
        </section>

        {/* Botones secundarios extras */}
        <section className="mb-6 space-y-2">
          <button className="flex w-full items-center justify-center rounded-full bg-black/60 px-6 py-3 text-[13px] font-medium uppercase tracking-[0.16em] text-white ring-1 ring-zinc-700/70">
            Antes y después
          </button>
          <button className="flex w-full items-center justify-center rounded-full bg-black/60 px-6 py-3 text-[13px] font-medium uppercase tracking-[0.16em] text-white ring-1 ring-zinc-700/70">
            Contacto
          </button>
        </section>

        {/* Promo destacada */}
        <section className="mt-2 space-y-3">
          <h2 className="text-xs uppercase tracking-[0.25em] text-zinc-500">
            Promoción del mes
          </h2>
          <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 via-zinc-900 to-black shadow-[0_18px_45px_rgba(0,0,0,0.8)]">
            <div className="px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#C9A96A]">
                Glow Facial
              </p>
              <h3 className="mt-1 text-base font-semibold">
                Limpieza profunda + Dermapen
              </h3>
              <p className="mt-2 text-xs text-zinc-300">
                Lográ una piel luminosa, uniforme y libre de impurezas.
              </p>
              <p className="mt-2 text-[11px] text-zinc-500">
                Duración: 90 min · Cupos limitados
              </p>
              <div className="mt-4 flex items-center justify-between">
                <button className="rounded-full bg-[#C9A96A] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black">
                  Reservar ahora
                </button>
                <span className="text-[11px] text-zinc-500">
                  Promo válida este mes
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex justify-center bg-gradient-to-t from-black via-black/95 to-black/60 pb-4 pt-3">
        <div className="flex w-full max-w-md items-center justify-between rounded-full border border-zinc-800 bg-black/80 px-5 py-2 backdrop-blur-xl">
          <button className="flex flex-1 flex-col items-center gap-0.5 text-[11px]">
            <span className="h-5 w-5 rounded-full bg-[#C9A96A]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#C9A96A]">
              Inicio
            </span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-0.5 text-[11px] text-zinc-500">
            <span className="h-5 w-5 rounded-full border border-zinc-600" />
            <span className="text-[10px] font-medium uppercase tracking-[0.18em]">
              Tratamientos
            </span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-0.5 text-[11px] text-zinc-500">
            <span className="h-5 w-5 rounded-full border border-zinc-600" />
            <span className="text-[10px] font-medium uppercase tracking-[0.18em]">
              Turnos
            </span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-0.5 text-[11px] text-zinc-500">
            <span className="h-5 w-5 rounded-full border border-zinc-600" />
            <span className="text-[10px] font-medium uppercase tracking-[0.18em]">
              Promos
            </span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-0.5 text-[11px] text-zinc-500">
            <span className="h-5 w-5 rounded-full border border-zinc-600" />
            <span className="text-[10px] font-medium uppercase tracking-[0.18em]">
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
