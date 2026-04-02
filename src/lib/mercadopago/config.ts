export function getMercadoPagoAccessToken(): string {
  const t = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!t) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN no está definida");
  }
  return t;
}

/** URL pública https sin barra final (ej. https://tudominio.com) */
export function getAppBaseUrl(): string {
  const u = (process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_BASE_URL ?? "").trim();
  if (!u) {
    throw new Error("APP_BASE_URL (o NEXT_PUBLIC_APP_BASE_URL) no está definida");
  }
  return u.replace(/\/$/, "");
}

export function getDepositAmountArs(): number {
  const raw = process.env.MERCADOPAGO_DEPOSIT_AMOUNT_ARS ?? "5000";
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("MERCADOPAGO_DEPOSIT_AMOUNT_ARS inválido");
  }
  return Math.round(n);
}
