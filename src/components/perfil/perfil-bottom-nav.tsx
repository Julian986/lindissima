"use client";

import { CalendarDays, Home as HomeIcon, Percent, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Inicio", Icon: HomeIcon, activeMatch: (p: string) => p === "/" },
  { href: "/tratamientos", label: "Tratamientos", Icon: Sparkles, activeMatch: (p: string) => p.startsWith("/tratamientos") },
  { href: "/turnos", label: "Turnos", Icon: CalendarDays, activeMatch: (p: string) => p.startsWith("/turnos") },
  { href: "/promociones", label: "Promos", Icon: Percent, activeMatch: (p: string) => p.startsWith("/promociones") },
  { href: "/perfil", label: "Perfil", Icon: User, activeMatch: (p: string) => p.startsWith("/perfil") },
] as const;

export function PerfilBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-30">
      <div className="flex w-full items-center justify-between border-t border-white/8 bg-black/60 px-4 py-2.5 backdrop-blur-[16px]">
        {nav.map(({ href, label, Icon, activeMatch }) => {
          const active = activeMatch(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1 ${
                active ? "text-[var(--premium-gold)]" : "text-[var(--soft-gray)]/80"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.8} />
              <span className={`text-[9px] tracking-[0.12em] ${active ? "text-[var(--premium-gold)]" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
