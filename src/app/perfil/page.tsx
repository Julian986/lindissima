"use client";

import { CalendarDays, Home as HomeIcon, Percent, Sparkles, User } from "lucide-react";
import Link from "next/link";

const profileLinks = [
  { href: "/tips-de-lumi", label: "Tips de Lumi", description: "Recomendaciones y cuidados" },
  { href: "#", label: "Mis turnos", description: "Ver y gestionar reservas" },
  { href: "#", label: "Historial de tratamientos", description: "Sesiones realizadas" },
  { href: "/promociones", label: "Promociones", description: "Ofertas vigentes" },
  { href: "#", label: "Datos personales", description: "Editar mi información" },
];

export default function PerfilPage() {
  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <main className="mx-auto w-full max-w-md px-4 pt-6 pb-24">
        <header className="mb-6 text-center">
          <h1 className="text-[28px] leading-none font-heading">Perfil</h1>
        </header>

        <section className="space-y-1">
          {profileLinks.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="flex items-center justify-between rounded-xl border border-white/8 bg-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#222]"
            >
              <div>
                <p className="text-[15px] font-medium text-[var(--soft-gray)]">{item.label}</p>
                <p className="mt-0.5 text-[11px] text-[var(--soft-gray)]/60">{item.description}</p>
              </div>
              <span className="text-[var(--soft-gray)]/50">›</span>
            </Link>
          ))}
        </section>
      </main>

      <nav className="fixed right-0 bottom-0 left-0 z-30">
        <div className="flex w-full items-center justify-between border-t border-white/8 bg-black/60 px-4 py-2.5 backdrop-blur-[16px]">
          <Link href="/" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <HomeIcon className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.9} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">Inicio</span>
          </Link>
          <Link href="/tratamientos" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <Sparkles className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">Tratamientos</span>
          </Link>
          <button className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <CalendarDays className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">Turnos</span>
          </button>
          <Link href="/promociones" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <Percent className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">Promos</span>
          </Link>
          <Link href="/perfil" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <User className="h-5 w-5 text-[var(--premium-gold)]" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--premium-gold)]">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
