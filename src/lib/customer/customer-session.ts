import { createHmac, timingSafeEqual } from "crypto";

export const CUSTOMER_PROFILE_COOKIE = "ld_customer_profile";

function sessionSecret(): string {
  const s = process.env.CUSTOMER_SESSION_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && !s) {
    throw new Error("CUSTOMER_SESSION_SECRET es obligatorio en producción.");
  }
  return s || "dev-ld-customer-session-cambiar";
}

/** Cookie firmada (HttpOnly) con el teléfono normalizado solo dígitos. */
export function mintCustomerProfileToken(phoneDigits: string, maxAgeMs = 60 * 24 * 60 * 60 * 1000): string {
  const exp = Date.now() + maxAgeMs;
  const payload = Buffer.from(JSON.stringify({ d: phoneDigits, exp }), "utf8").toString("base64url");
  const sig = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function readCustomerProfilePhoneDigits(token: string | undefined): string | null {
  if (!token || typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  if (sig.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))) return null;
  } catch {
    return null;
  }
  let parsed: { d?: string; exp?: number };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { d?: string; exp?: number };
  } catch {
    return null;
  }
  if (!parsed.d || typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;
  return String(parsed.d);
}
