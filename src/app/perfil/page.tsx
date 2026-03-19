"use client";

import {
  CalendarDays,
  Clock3,
  Home as HomeIcon,
  Percent,
  Sparkles,
  User,
  UserCog,
} from "lucide-react";
import Link from "next/link";

type ProfileItem = {
  href: string;
  label: string;
  description?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const primaryItems: ProfileItem[] = [
  {
    href: "/turnos",
    label: "Mis turnos",
    description: "Ver próximos y pasados",
    icon: CalendarDays,
  },
  {
    href: "#",
    label: "Historial de tratamientos",
    description: "Sesiones realizadas",
    icon: Clock3,
  },
  {
    href: "/promociones",
    label: "Promociones",
    description: "Beneficios para vos",
    icon: Percent,
  },
  {
    href: "#",
    label: "Datos personales",
    description: "Tus datos y preferencias",
    icon: UserCog,
  },
];

export default function PerfilPage() {
  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <main className="mx-auto w-full max-w-md px-4 pt-6 pb-24">
        <header className="mb-5 text-center">
          <h1 className="text-[28px] leading-none font-heading">Perfil</h1>
        </header>

        <section className="rounded-2xl border border-white/8 bg-[#181818] px-3 py-1.5 shadow-[0_14px_30px_rgba(0,0,0,0.65)]">
          <div className="divide-y divide-white/10">
            {primaryItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between px-1 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/35">
                      <Icon
                        className="h-4 w-4 text-[var(--soft-gray)]/85"
                        strokeWidth={1.7}
                      />
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-[var(--soft-gray)]">
                        {item.label}
                      </p>
                      {item.description && (
                        <p className="mt-0.5 text-[11px] text-[var(--soft-gray)]/60">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-[var(--soft-gray)]/50">›</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-white/6 bg-[#141414] px-4 py-3">
          <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--soft-gray)]/70">
            A futuro en tu perfil
          </p>
          <p className="mt-1.5 text-[13px] text-[var(--soft-gray)]/92">
            Ficha estética, evolución de tratamientos y tips personalizados para
            tu piel en LINDISSIMA.
          </p>
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
          <Link
            href="/tratamientos"
            className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80"
          >
            <Sparkles className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">Tratamientos</span>
          </Link>
          <Link href="/turnos" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <CalendarDays className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">Turnos</span>
          </Link>
          <Link
            href="/promociones"
            className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80"
          >
            <Percent className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">Promos</span>
          </Link>
          <Link href="/perfil" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <User className="h-5 w-5 text-[var(--premium-gold)]" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--premium-gold)]">
              Perfil
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
