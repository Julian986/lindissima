"use client";

import { CalendarDays, Home as HomeIcon, Percent, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type ResultCategory = "Láser" | "Facial" | "Cejas" | "Corporal";

type ComparisonItem = {
  id: string;
  category: ResultCategory;
  beforeImage: string;
  afterImage: string;
};

type PackItem = {
  id: string;
  category: ResultCategory;
  imageUrl: string;
  area: string;
  title: string;
  subtitle: string;
  oldPrice: string;
  newPrice: string;
  discountText: string;
};

const categories: ResultCategory[] = ["Láser", "Facial", "Cejas", "Corporal"];

const comparisons: ComparisonItem[] = [
  {
    id: "facial-1",
    category: "Facial",
    beforeImage:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
    afterImage:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "laser-1",
    category: "Láser",
    beforeImage:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80",
    afterImage:
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cejas-1",
    category: "Cejas",
    beforeImage:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80",
    afterImage:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "corporal-1",
    category: "Corporal",
    beforeImage:
      "https://images.unsplash.com/photo-1556229010-aa3f7ff66b24?auto=format&fit=crop&w=900&q=80",
    afterImage:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
  },
];

const packs: PackItem[] = [
  {
    id: "laser-pack",
    category: "Láser",
    imageUrl:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1300&q=80",
    area: "Pierna",
    title: "Depilación Láser",
    subtitle: "Soprano Titanium",
    oldPrice: "$69.000",
    newPrice: "$39.900",
    discountText: "Precio con descuento",
  },
  {
    id: "facial-pack",
    category: "Facial",
    imageUrl:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1300&q=80",
    area: "Rostro",
    title: "Limpieza + Dermapen",
    subtitle: "Glow Facial",
    oldPrice: "$59.000",
    newPrice: "$35.900",
    discountText: "Pack de sesión",
  },
  {
    id: "cejas-pack",
    category: "Cejas",
    imageUrl:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1300&q=80",
    area: "Mirada",
    title: "Diseño de Cejas",
    subtitle: "Perfilado Premium",
    oldPrice: "$32.000",
    newPrice: "$22.900",
    discountText: "Pack promoción",
  },
  {
    id: "corporal-pack",
    category: "Corporal",
    imageUrl:
      "https://images.unsplash.com/photo-1556229010-aa3f7ff66b24?auto=format&fit=crop&w=1300&q=80",
    area: "Corporal",
    title: "Modelado corporal",
    subtitle: "Cavitación + drenaje",
    oldPrice: "$79.000",
    newPrice: "$49.900",
    discountText: "Promo especial",
  },
];

export default function BeforeAfterPage() {
  const [activeCategory, setActiveCategory] = useState<ResultCategory>("Facial");

  const activeComparison = useMemo(
    () => comparisons.find((item) => item.category === activeCategory),
    [activeCategory],
  );

  const activePack = useMemo(
    () => packs.find((item) => item.category === activeCategory),
    [activeCategory],
  );

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <main className="mx-auto w-full max-w-md px-4 pt-5 pb-24">
        <header className="mb-3 flex items-center justify-between px-1">
          <Link href="/" className="text-[var(--soft-gray)]/90" aria-label="Volver a inicio">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path d="M15 5L8 12L15 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </Link>
          <div className="text-center">
            <img src="/corona%20svg.svg" alt="" aria-hidden="true" className="mx-auto h-10 w-20 object-contain" />
            <h1 className="mt-1 text-[42px] leading-none font-heading tracking-wide">LINDISSIMA</h1>
            <p className="mt-0.5 text-[10px] tracking-[0.18em] text-[var(--soft-gray)]/90">
              Láser & Treatments
            </p>
          </div>
          <span className="h-5 w-5" />
        </header>

        <section className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((category) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[#2d2d2d] text-[var(--soft-gray)]"
                    : "bg-transparent text-[var(--soft-gray)]/70"
                }`}
              >
                {category}
              </button>
            );
          })}
        </section>

        {activeComparison && (
          <section className="mb-3 grid grid-cols-2 gap-2">
            <article className="relative overflow-hidden rounded-xl border border-white/8">
              <img
                src={activeComparison.beforeImage}
                alt="Resultado antes"
                className="h-40 w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <span className="absolute bottom-2 left-2 rounded-full bg-black/45 px-3 py-1 text-[34px] leading-none text-[var(--soft-gray)] backdrop-blur-[8px] font-heading">
                Antes
              </span>
            </article>
            <article className="relative overflow-hidden rounded-xl border border-white/8">
              <img
                src={activeComparison.afterImage}
                alt="Resultado después"
                className="h-40 w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <span className="absolute bottom-2 left-2 rounded-full bg-black/45 px-3 py-1 text-[34px] leading-none text-[var(--soft-gray)] backdrop-blur-[8px] font-heading">
                Después
              </span>
            </article>
          </section>
        )}

        {activePack && (
          <section className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#171717] shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
            <img
              src={activePack.imageUrl}
              alt={activePack.title}
              className="h-40 w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/90 via-[#111111]/55 to-transparent" />

            <div className="relative z-10 px-4 py-3">
              <p className="text-[11px] tracking-[0.04em] text-[var(--soft-gray)]/80">{activePack.area}</p>
              <h2 className="mt-1 text-[44px] leading-none font-heading">{activePack.title}</h2>
              <p className="mt-1 text-[32px] leading-none font-heading text-[var(--soft-gray)]/90">
                {activePack.subtitle}
              </p>

              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="text-[10px] text-[var(--soft-gray)]/70">{activePack.discountText}</div>
                <div className="text-right">
                  <p className="text-[20px] leading-none text-[var(--soft-gray)]/70 line-through">
                    {activePack.oldPrice}
                  </p>
                  <p className="mt-1 text-[46px] leading-none font-heading">{activePack.newPrice}</p>
                </div>
              </div>

              <button className="mt-3 h-10 w-full rounded-full bg-[var(--premium-gold)] text-[34px] leading-none font-heading text-[#1f1b16]">
                Comprar pack
              </button>
            </div>
          </section>
        )}
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
          <button className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <CalendarDays className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">Turnos</span>
          </button>
          <Link href="/promociones" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <Percent className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">Promos</span>
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
