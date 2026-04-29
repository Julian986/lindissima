"use client";

import { CalendarDays, Clock3, Percent, UserCog } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { isLikelyWhatsappNumber } from "@/lib/customer/phone-canonical-ar";
import { event as gaEvent } from "@/lib/gtag";
import { usePerfilSession } from "@/components/perfil/perfil-session-provider";

export function PerfilHomeClient() {
  const { me, welcomeName, logout, onLoginSuccess } = usePerfilSession();

  const [phoneInput, setPhoneInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isLikelyWhatsappNumber(phoneInput)) {
      setError("Ingresá un WhatsApp válido (10 a 15 dígitos).");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/me/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ phone: phoneInput.trim(), source: "perfil" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }
      gaEvent("customer_session_start", { login_source: "perfil" });
      setPhoneInput("");
      await onLoginSuccess();
    } catch {
      setError("Sin conexión. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    try {
      await logout();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-6 pb-24">
      <header className="mb-5 text-center">
        <h1 className="font-heading text-[28px] leading-none">Perfil</h1>
        {me === "authed" ? (
          <div className="mt-3 space-y-1.5">
            <p className="text-[17px] font-medium leading-snug text-[var(--soft-gray)]">
              {welcomeName ? (
                <>
                  Hola, <span className="text-[var(--premium-gold)]">{welcomeName}</span>
                </>
              ) : (
                <span>Bienvenida</span>
              )}
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleLogout()}
              className="text-[12px] cursor-pointer text-[var(--soft-gray)]/55 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Cerrar sesión
            </button>
          </div>
        ) : me === "guest" ? (
          <p className="mt-2 text-[12px] text-[var(--soft-gray)]/62">
            Iniciá sesión con tu WhatsApp para ver tus turnos.
          </p>
        ) : (
          <p className="mt-2 text-[12px] text-[var(--soft-gray)]/50">Comprobando sesión…</p>
        )}
      </header>

      {me === "guest" ? (
        <section
          id="acceso"
          className="mb-4 rounded-2xl border border-white/8 bg-[#181818] px-4 py-4 shadow-[0_14px_30px_rgba(0,0,0,0.65)]"
        >
          <p className="text-[11px] tracking-[0.14em] text-[var(--soft-gray)]/55">Acceso</p>
          <form onSubmit={(e) => void handleLogin(e)} className="mt-3 space-y-3">
            <div>
              <label htmlFor="perfil-phone" className="text-[11px] text-[var(--soft-gray)]/55">
                Mismo WhatsApp que usás al reservar
              </label>
              <input
                id="perfil-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+54 9 11 …"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-3 text-[15px] text-[var(--soft-gray)] outline-none focus:border-[var(--premium-gold)]/55"
              />
            </div>
            {error ? (
              <p role="alert" className="text-[12px] text-red-300/95">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--premium-gold)] text-[14px] font-semibold text-black shadow-[0_6px_20px_rgba(206,120,50,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "…" : "Ver mis datos"}
            </button>
          </form>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/8 bg-[#181818] px-3 py-1.5 shadow-[0_14px_30px_rgba(0,0,0,0.65)]">
        <div className="divide-y divide-white/10">
          <Link
            href="/perfil/mis-turnos"
            className="flex cursor-pointer items-center justify-between px-1 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/35">
                <CalendarDays className="h-4 w-4 text-[var(--soft-gray)]/85" strokeWidth={1.7} />
              </div>
              <div>
                <p className="text-[15px] font-medium text-[var(--soft-gray)]">Mis turnos</p>
                <p className="mt-0.5 text-[11px] text-[var(--soft-gray)]/60">Próximos y pasados</p>
              </div>
            </div>
            <span className="text-xs text-[var(--soft-gray)]/50">›</span>
          </Link>
          <Link
            href="/perfil/historial-tratamientos"
            className="flex cursor-pointer items-center justify-between px-1 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/35">
                <Clock3 className="h-4 w-4 text-[var(--soft-gray)]/85" strokeWidth={1.7} />
              </div>
              <div>
                <p className="text-[15px] font-medium text-[var(--soft-gray)]">Historial de tratamientos</p>
                <p className="mt-0.5 text-[11px] text-[var(--soft-gray)]/60">Sesiones realizadas</p>
              </div>
            </div>
            <span className="text-xs text-[var(--soft-gray)]/50">›</span>
          </Link>
          <Link
            href="/promociones"
            className="flex cursor-pointer items-center justify-between px-1 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/35">
                <Percent className="h-4 w-4 text-[var(--soft-gray)]/85" strokeWidth={1.7} />
              </div>
              <div>
                <p className="text-[15px] font-medium text-[var(--soft-gray)]">Promociones</p>
                <p className="mt-0.5 text-[11px] text-[var(--soft-gray)]/60">Beneficios para vos</p>
              </div>
            </div>
            <span className="text-xs text-[var(--soft-gray)]/50">›</span>
          </Link>
          <div className="flex items-center justify-between px-1 py-3 opacity-45">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/35">
                <UserCog className="h-4 w-4 text-[var(--soft-gray)]/85" strokeWidth={1.7} />
              </div>
              <div>
                <p className="text-[15px] font-medium text-[var(--soft-gray)]">Datos personales</p>
                <p className="mt-0.5 text-[11px] text-[var(--soft-gray)]/60">Próximamente</p>
              </div>
            </div>
            <span className="text-xs text-[var(--soft-gray)]/50">›</span>
          </div>
        </div>
      </section>

      {me === "guest" ? (
        <section className="mt-4 rounded-2xl border border-white/6 bg-[#141414] px-4 py-3">
          <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--soft-gray)]/70">Tip</p>
          <p className="mt-1.5 text-[13px] text-[var(--soft-gray)]/92">
            Usá el mismo número de WhatsApp que al reservar en la web o en el salón. Nadie más puede ver tus turnos
            sin ese número.
          </p>
        </section>
      ) : null}
    </main>
  );
}
