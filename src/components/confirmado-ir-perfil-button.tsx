"use client";

import { useState } from "react";
import { event as gaEvent } from "@/lib/gtag";

export function ConfirmadoIrPerfilButton({ phone }: { phone: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const p = phone.trim();
      if (p) {
        const res = await fetch("/api/me/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ phone: p, source: "confirmado" }),
        });
        if (res.ok) {
          gaEvent("customer_session_start", { login_source: "confirmado" });
        }
      }
    } catch {
      // Si falla la sesión, igual llevamos al perfil.
    } finally {
      window.location.href = "/perfil";
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="mt-6 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#b89253] to-[#e2cb9a] text-[19px] font-heading text-black shadow-[0_10px_28px_rgba(184,146,83,0.35)] disabled:cursor-default disabled:opacity-70"
    >
      {loading ? "Ingresando a perfil…" : "Ir a mis turnos →"}
    </button>
  );
}
