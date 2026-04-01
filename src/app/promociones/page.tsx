"use client";

import { CalendarDays, Home as HomeIcon, Percent, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { LaserPromoEnganche } from "@/components/laser-promo-enganche";

type PromoCategory = "Láser" | "Facial" | "Cejas" | "Corporal";

type Promo = {
  id: string;
  title: string;
  subtitle: string;
  details: string;
  imageUrl: string;
  category: PromoCategory;
};

const promoCategories: PromoCategory[] = ["Láser", "Facial", "Cejas", "Corporal"];

const promos: Promo[] = [
  {
    id: "glow-facial",
    title: "Glow Facial",
    subtitle: "Limpieza profunda",
    details: "Limpieza profunda + Dermapen.",
    imageUrl:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
    category: "Facial",
  },
  {
    id: "promo-laser",
    title: "Promo Láser",
    subtitle: "Pack depilación",
    details: "Cavado completo + tira + axilas.",
    imageUrl:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80",
    category: "Láser",
  },
  {
    id: "dermapen-combo",
    title: "Dermapen",
    subtitle: "Renovación celular",
    details: "Dermapen + activos reparadores.",
    imageUrl:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80",
    category: "Facial",
  },
  {
    id: "exosomas-plus",
    title: "Exosomas",
    subtitle: "Piel revitalizada",
    details: "Exosomas + máscara calmante.",
    imageUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80",
    category: "Facial",
  },
  {
    id: "cejas-design",
    title: "Cejas Premium",
    subtitle: "Diseño y perfilado",
    details: "Diseño de cejas + visagismo.",
    imageUrl:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80",
    category: "Cejas",
  },
  {
    id: "corporal-shape",
    title: "Corporal Shape",
    subtitle: "Modelado corporal",
    details: "Cavitación + drenaje linfático.",
    imageUrl:
      "https://images.unsplash.com/photo-1556229010-aa3f7ff66b24?auto=format&fit=crop&w=900&q=80",
    category: "Corporal",
  },
];

export default function PromotionsPage() {
  const [activeCategory, setActiveCategory] = useState<PromoCategory>("Láser");

  const filteredPromos = useMemo(
    () => promos.filter((promo) => promo.category === activeCategory),
    [activeCategory],
  );

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <main className="mx-auto w-full max-w-md px-4 pt-6 pb-24">
        <header className="mb-4 text-center">
          <h1 className="text-[34px] leading-none font-heading">Promociones</h1>
        </header>

        <section className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
          {promoCategories.map((category) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[#2a2a2a] text-[var(--soft-gray)]"
                    : "bg-transparent text-[var(--soft-gray)]/70"
                }`}
              >
                {category}
              </button>
            );
          })}
        </section>

        {activeCategory === "Láser" ? <LaserPromoEnganche /> : null}

        <section className="space-y-3">
          {filteredPromos.map((promo) => (
            <article
              key={promo.id}
              className="relative h-40 overflow-hidden rounded-2xl border border-white/8 bg-[#1a1a1a] shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
            >
              <img
                src={promo.imageUrl}
                alt={promo.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-[#f1e8d8]/35 to-[#f1e8d8]/85" />

              <div className="relative z-10 ml-auto flex h-full w-[53%] flex-col px-3 py-2.5">
                <h2 className="text-[28px] leading-none font-heading text-[#1b1916]">{promo.title}</h2>
                <p className="mt-1 text-[11px] text-[#2c2922]/80">{promo.subtitle}</p>
                <p className="mt-1 text-[11px] leading-tight text-[#2c2922]/90">{promo.details}</p>
                <div className="mt-auto pt-2">
                  <Link
                    href={`/turnos?treatment=${encodeURIComponent(promo.title)}`}
                    className="flex h-8 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#b89253] to-[#e2cb9a] text-[13px] font-medium text-white"
                  >
                    Reservar
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
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
          <Link href="/turnos" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <CalendarDays className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">Turnos</span>
          </Link>
          <Link href="/promociones" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <Percent className="h-5 w-5 text-[var(--premium-gold)]" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--premium-gold)]">
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
