"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PanelLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/panel-turnos/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo ingresar.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de red. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#111111] px-4 pb-20 pt-8 text-white">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#b89253] to-[#e2cb9a] shadow-[0_10px_30px_rgba(201,169,106,0.25)]">
          <Sparkles className="h-7 w-7 text-[#1a150c]" strokeWidth={2} />
        </div>
        <h1 className="font-heading text-[28px] text-[var(--premium-gold)]">Panel de turnos</h1>
        <p className="max-w-xs text-[14px] text-[var(--soft-gray)]/78">
          Ingresá la contraseña para ver la agenda de Lindissima.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#171717] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
      >
        <label htmlFor="panel-password" className="text-[11px] tracking-[0.12em] text-[var(--soft-gray)]/55">
          Contraseña
        </label>
        <input
          id="panel-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-3 text-[15px] text-[var(--soft-gray)] outline-none focus:border-[var(--premium-gold)]/55"
        />
        {error ? (
          <p role="alert" className="mt-3 text-center text-[13px] text-red-300/95">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading || !password}
          className="mt-5 h-[52px] w-full rounded-full bg-gradient-to-r from-[#b89253] to-[#e2cb9a] text-[16px] font-heading text-white shadow-[0_0_24px_rgba(201,169,106,0.22)] disabled:opacity-45"
        >
          {loading ? "Ingresando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
