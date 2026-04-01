"use client";

import { CalendarDays, Home as HomeIcon, Percent, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { LaserPromoEnganche } from "@/components/laser-promo-enganche";

type Category = "Láser" | "Facial" | "Corporal";

type Service = {
  id: string;
  name: string;
  description: string;
  duration: string;
  imageUrl: string;
  category: Category;
};

const categories: Category[] = ["Láser", "Facial", "Corporal"];

const services: Service[] = [
  {
    id: "laser-soprano-titanium",
    name: "Depilación Láser",
    description: "Soprano Titanium 4 ondas de profundidad.",
    duration: "60 min",
    imageUrl:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80",
    category: "Láser",
  },
  {
    id: "facial-limpieza",
    name: "Limpieza Facial Profunda",
    description: "Higienización profunda, extracción y renovación.",
    duration: "60 min",
    imageUrl:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
    category: "Facial",
  },
  {
    id: "facial-dermapen",
    name: "Dermapen",
    description: "Microestimulación para mejorar textura y luminosidad.",
    duration: "60 min",
    imageUrl:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80",
    category: "Facial",
  },
  {
    id: "facial-exosomas",
    name: "Exosomas",
    description: "Reparación intensiva y regeneración de la piel.",
    duration: "50 min",
    imageUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80",
    category: "Facial",
  },
  {
    id: "facial-radiofrecuencia",
    name: "Radiofrecuencia Facial",
    description: "Reafirma y estimula colágeno de forma no invasiva.",
    duration: "45 min",
    imageUrl:
      "https://images.unsplash.com/photo-1556227834-09f1de7a7d14?auto=format&fit=crop&w=900&q=80",
    category: "Facial",
  },
  {
    id: "facial-alta-frecuencia",
    name: "Alta Frecuencia",
    description: "Oxigenación, equilibrio y efecto antiseborreico.",
    duration: "35 min",
    imageUrl:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
    category: "Facial",
  },
  {
    id: "facial-electroporacion",
    name: "Electroporación",
    description: "Vehiculización de activos sin agujas.",
    duration: "40 min",
    imageUrl:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80",
    category: "Facial",
  },
  {
    id: "corporal-radiofrecuencia",
    name: "Radiofrecuencia Corporal",
    description: "Reafirmación de tejidos y mejora de flacidez.",
    duration: "60 min",
    imageUrl:
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80",
    category: "Corporal",
  },
  {
    id: "corporal-cavitacion",
    name: "Cavitación",
    description: "Modelado corporal para adiposidad localizada.",
    duration: "50 min",
    imageUrl:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
    category: "Corporal",
  },
  {
    id: "corporal-drenaje",
    name: "Drenaje Linfático",
    description: "Estimula circulación y reduce retención.",
    duration: "60 min",
    imageUrl:
      "https://images.unsplash.com/photo-1556229010-aa3f7ff66b24?auto=format&fit=crop&w=900&q=80",
    category: "Corporal",
  },
  {
    id: "corporal-maderoterapia",
    name: "Maderoterapia",
    description: "Tratamiento manual para moldeado y tonicidad.",
    duration: "55 min",
    imageUrl:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80",
    category: "Corporal",
  },
  {
    id: "corporal-masajes",
    name: "Masajes Reductores",
    description: "Trabajo focalizado para mejorar contorno corporal.",
    duration: "50 min",
    imageUrl:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
    category: "Corporal",
  },
  {
    id: "corporal-electroestimulador",
    name: "Electroestimulador",
    description: "Tonificación muscular y complemento de remodelación.",
    duration: "40 min",
    imageUrl:
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80",
    category: "Corporal",
  },
  {
    id: "corporal-endermologie",
    name: "Endermologie",
    description: "Estimulación mecánica para una piel más uniforme.",
    duration: "55 min",
    imageUrl:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80",
    category: "Corporal",
  },
];

export default function TreatmentsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("Láser");

  const filteredServices = useMemo(
    () => services.filter((service) => service.category === activeCategory),
    [activeCategory],
  );

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <main className="mx-auto w-full max-w-md px-4 pt-6 pb-24">
        <header className="mb-4 text-center">
          <h1 className="text-[34px] leading-none font-heading">Tratamientos</h1>
        </header>

        <section className="mb-2 flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((category) => {
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

        <div className="mb-2">
          <Link
            href="/antes-y-despues"
            className="flex h-10 w-full items-center justify-center rounded-full border border-[var(--premium-gold)]/30 bg-black/40 text-[13px] font-medium text-[var(--soft-gray)] shadow-[inset_0_1px_0_rgba(201,169,106,0.14)] transition-colors hover:border-[var(--premium-gold)]/48 hover:bg-[var(--premium-gold)]/[0.07] hover:text-[var(--premium-gold)]"
          >
            Ver antes y después
          </Link>
        </div>

        {activeCategory === "Láser" ? <LaserPromoEnganche /> : null}

        <section className="grid grid-cols-2 gap-3">
          {filteredServices.map((service) => (
            <article
              key={service.id}
              className="overflow-hidden rounded-2xl border border-white/8 bg-[#1a1a1a] shadow-[0_8px_22px_rgba(0,0,0,0.45)]"
            >
              <div className="relative">
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  loading="lazy"
                  decoding="async"
                  className="h-32 w-full object-cover"
                />
                {/* Degrade para transicion suave entre imagen y texto */}
                <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-16 bg-gradient-to-b from-transparent to-[#1a1a1a]" />
              </div>

              <div className="relative z-10 -mt-2 px-3 pt-0 pb-3">
                <h2 className="text-[21px] leading-tight font-heading">{service.name}</h2>
                <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-[var(--soft-gray)]/80">
                  {service.description}
                </p>
                <p className="mt-1 text-[10px] tracking-[0.08em] text-[var(--soft-gray)]/65">
                  Duración: {service.duration}
                </p>

                <Link
                  href={`/turnos?treatment=${encodeURIComponent(service.name)}`}
                  className="mt-2 flex h-8 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#b89253] to-[#e2cb9a] text-[14px] font-medium text-white"
                >
                  Reservar
                </Link>
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
            <Sparkles className="h-5 w-5 text-[var(--premium-gold)]" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--premium-gold)]">
              Tratamientos
            </span>
          </Link>
          <Link href="/turnos" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <CalendarDays className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">Turnos</span>
          </Link>
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
