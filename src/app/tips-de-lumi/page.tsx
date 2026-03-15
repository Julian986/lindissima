"use client";

import { CalendarDays, Home as HomeIcon, Percent, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type LumiTip = {
  id: string;
  titleLines: string[];
  content: string;
  imageUrl: string;
};

const tips: LumiTip[] = [
  {
    id: "tip-limpieza",
    titleLines: [
      "Cada cuanto hacerse",
      "una limpieza facial profesional?",
    ],
    content:
      "Para cuidar y mantener tu piel sana y luminosa, es recomendable realizar una limpieza facial profesional cada 30 a 45 dias. Este habito ayuda a eliminar impurezas, puntos negros y a mantener el equilibrio de la piel.",
    imageUrl:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "tip-laser",
    titleLines: [
      "Durante tratamientos laser",
      "evita la exposicion solar directa",
    ],
    content:
      "Durante tratamientos laser es importante evitar exposicion solar directa y usar protector solar de amplio espectro. Esto reduce irritacion y mejora los resultados de cada sesion.",
    imageUrl:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "tip-protector",
    titleLines: [
      "El protector solar es",
      "el mejor tratamiento antiage",
    ],
    content:
      "Usar protector solar todos los dias es clave para prevenir manchas y envejecimiento prematuro. Reaplicalo cada 2 a 3 horas, incluso en dias nublados.",
    imageUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1400&q=80",
  },
];

export default function TipsDeLumiPage() {
  const [activeTip, setActiveTip] = useState(0);
  const currentTip = tips[activeTip];

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <main className="mx-auto w-full max-w-md px-4 pt-4 pb-24">
        <header className="mb-3 text-center">
          <img
            src="/corona%20svg.svg"
            alt=""
            aria-hidden="true"
            className="mx-auto h-9 w-18 object-contain"
          />
          <h1 className="mt-1 text-[34px] leading-none font-heading text-[var(--premium-gold)]">
            Tips de Lumi
          </h1>
        </header>

        <article className="overflow-hidden rounded-[2px] border border-white/8 bg-[#141414]">
          <div className="relative h-[330px] w-full">
            <img
              src={currentTip.imageUrl}
              alt={currentTip.titleLines.join(" ")}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/18 to-transparent" />

            <div className="absolute right-0 bottom-0 left-0 px-4 pb-4">
              <h2 className="text-[26px] leading-[1.14] font-heading text-[var(--soft-gray)]">
                <span className="text-[var(--premium-gold)]">✦ </span>
                {currentTip.titleLines[0]}
                <br />
                {currentTip.titleLines[1]}
              </h2>
            </div>
          </div>

          <div className="bg-gradient-to-b from-[#141414] to-[#111111] px-4 py-4">
            <p className="text-[14px] leading-[1.72] text-[var(--soft-gray)]/92">
              {currentTip.content}
            </p>
          </div>
        </article>

        <div className="mt-3 flex items-center justify-center gap-2">
          {tips.map((tip, index) => (
            <button
              key={tip.id}
              onClick={() => setActiveTip(index)}
              aria-label={`Ver ${tip.id}`}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                activeTip === index
                  ? "bg-[var(--premium-gold)]"
                  : "bg-[var(--soft-gray)]/45"
              }`}
            />
          ))}
        </div>
      </main>

      <nav className="fixed right-0 bottom-0 left-0 z-30">
        <div className="flex w-full items-center justify-between border-t border-white/8 bg-black/60 px-4 py-2.5 backdrop-blur-[16px]">
          <Link href="/" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <HomeIcon className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.9} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">
              Inicio
            </span>
          </Link>
          <Link href="/tratamientos" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <Sparkles className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">
              Tratamientos
            </span>
          </Link>
          <Link href="/tips-de-lumi" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <CalendarDays className="h-5 w-5 text-[var(--premium-gold)]" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--premium-gold)]">
              Turnos
            </span>
          </Link>
          <Link href="/promociones" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <Percent className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">
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
