"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const FLYER_SRC = "/flyer.jpeg";

const WHATSAPP_LASER =
  "https://wa.me/542915247730?text=" +
  encodeURIComponent(
    "Hola Lindissima, consulto por la promo de depilación láser (cavado completo + tira a $17.500).",
  );

const toggleBtnClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-black/50 text-[var(--soft-gray)] shadow-sm backdrop-blur-sm transition hover:border-[var(--premium-gold)]/40 hover:text-[var(--premium-gold)]";

export function LaserPromoEnganche() {
  const [showTextBlock, setShowTextBlock] = useState(true);

  return (
    <section
      className="mb-4 overflow-hidden rounded-[22px] border border-[var(--premium-gold)]/28 bg-gradient-to-br from-[#1f1a14] via-[#171717] to-[#141210] shadow-[0_14px_36px_rgba(0,0,0,0.42)]"
      aria-labelledby={showTextBlock ? "laser-enganche-title" : undefined}
      aria-label={!showTextBlock ? "Promo láser depilación definitiva" : undefined}
    >
      {showTextBlock ? (
        <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--premium-gold)]/88">
              PROMO LÁSER
            </p>
            <h2
              id="laser-enganche-title"
              className="mt-1.5 text-[32px] leading-none font-heading text-[var(--premium-gold)]"
            >
              $17.500
            </h2>
            <p className="mt-2 text-[15px] font-semibold leading-snug text-[var(--soft-gray)]">
              Cavado completo + tira
            </p>
            {/* Depilación definitiva · Soprano Titanium · láser diodo 4 ondas */}
          </div>
          <button
            type="button"
            onClick={() => setShowTextBlock(false)}
            aria-pressed={true}
            aria-label="Ocultar texto de precio y descripción"
            className={`${toggleBtnClass} -translate-y-1`}
          >
            <EyeOff className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      ) : null}

      <div className="relative w-full bg-black/30">
        {!showTextBlock ? (
          <button
            type="button"
            onClick={() => setShowTextBlock(true)}
            aria-pressed={false}
            aria-label="Mostrar texto de precio y descripción"
            className={`${toggleBtnClass} absolute right-3 top-3 z-10`}
          >
            <Eye className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : null}
        <Image
          src={FLYER_SRC}
          alt="Flyer promocional depilación definitiva Lindissima"
          width={900}
          height={1350}
          className="block h-auto w-full"
          sizes="(max-width: 448px) 100vw, 448px"
          priority
        />
      </div>

      <div className="flex flex-col gap-2 p-4 pt-3">
        <Link
          href="/turnos?treatment=depilacion-laser"
          className="flex h-10 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#b89253] to-[#e2cb9a] text-[14px] font-medium text-white shadow-[0_6px_20px_rgba(201,169,106,0.22)]"
        >
          Reservar turno
        </Link>
        <a
          href={WHATSAPP_LASER}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 w-full items-center justify-center rounded-full border border-white/14 bg-white/5 text-[13px] font-medium text-[var(--soft-gray)] transition hover:border-[var(--premium-gold)]/35 hover:bg-white/[0.07]"
        >
          Consultar por WhatsApp
        </a>
      </div>
    </section>
  );
}
