import { createHash } from "crypto";
import type { Db } from "mongodb";

const COLLECTION = "customer_session_events";
const DAILY_ACTIVE_COLLECTION = "customer_daily_active_users";

const ALLOWED_SOURCES = new Set(["perfil", "confirmado"]);
const ALLOWED_ACTIVITY_SOURCES = new Set(["turnos", "perfil_home", "mis_turnos", "unknown"]);

export type CustomerSessionEventSource = "perfil" | "confirmado" | "unknown";
export type CustomerActivitySource = "turnos" | "perfil_home" | "mis_turnos" | "unknown";

function analyticsSecret(): string {
  const s = process.env.CUSTOMER_SESSION_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && !s) {
    throw new Error("CUSTOMER_SESSION_SECRET es obligatorio en producción.");
  }
  return s || "dev-ld-customer-session-cambiar";
}

export function normalizeSessionEventSource(raw: unknown): CustomerSessionEventSource {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (ALLOWED_SOURCES.has(s)) return s as CustomerSessionEventSource;
  return "unknown";
}

export function normalizeActivitySource(raw: unknown): CustomerActivitySource {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (ALLOWED_ACTIVITY_SOURCES.has(s)) return s as CustomerActivitySource;
  return "unknown";
}

/** Huella irreversible del teléfono (no guardamos el número en claro). */
export function fingerprintPhoneDigitsForSessionAnalytics(digits: string): string {
  return createHash("sha256").update(`ld_session_v1|${digits}|${analyticsSecret()}`).digest("hex");
}

let indexesEnsured = false;
let dailyIndexesEnsured = false;

export async function ensureCustomerSessionEventIndexes(db: Db): Promise<void> {
  if (indexesEnsured) return;
  const col = db.collection(COLLECTION);
  await col.createIndex({ at: -1 }, { name: "session_events_at" });
  await col.createIndex({ phoneFingerprint: 1, at: -1 }, { name: "session_events_phone_at" });
  indexesEnsured = true;
}

export async function ensureCustomerDailyActiveIndexes(db: Db): Promise<void> {
  if (dailyIndexesEnsured) return;
  const col = db.collection(DAILY_ACTIVE_COLLECTION);
  await col.createIndex({ dayKey: 1, phoneFingerprint: 1 }, { name: "daily_active_unique", unique: true });
  await col.createIndex({ dayKey: -1 }, { name: "daily_active_day" });
  dailyIndexesEnsured = true;
}

function argentinaDayKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

/**
 * Fecha y hora en horario de Argentina (UTC-3 fijo, sin DST desde 2009).
 * Devuelve un string ISO 8601 con offset explícito: "2026-04-27T16:12:56.941-03:00".
 */
function argentinaIsoString(date: Date): string {
  const local = new Date(date.getTime() - 3 * 60 * 60_000);
  return local.toISOString().replace("Z", "-03:00");
}

/**
 * Registra un inicio de sesión de cliente (POST /api/me/session exitoso).
 * No debe romper el login si falla el insert.
 */
export async function logCustomerSessionStart(
  db: Db,
  input: {
    phoneDigits: string;
    userAgent: string | null;
    source: CustomerSessionEventSource;
    customerName?: string | null;
  },
): Promise<void> {
  try {
    await ensureCustomerSessionEventIndexes(db);
    const now = new Date();
    await db.collection(COLLECTION).insertOne({
      at: now,
      atBsAs: argentinaIsoString(now),
      phoneFingerprint: fingerprintPhoneDigitsForSessionAnalytics(input.phoneDigits),
      customerName: input.customerName?.trim() || null,
      source: input.source,
      userAgent: (input.userAgent ?? "").slice(0, 240),
    });
  } catch (e) {
    console.error("[customer_session_events]", e);
  }
}

/**
 * Registra actividad diaria única del cliente (DAU) con upsert por día+usuario.
 * No debe romper respuestas de API si falla.
 */
export async function logCustomerDailyActive(
  db: Db,
  input: {
    phoneDigits: string;
    source: CustomerActivitySource;
    customerName?: string | null;
    at?: Date;
  },
): Promise<void> {
  try {
    await ensureCustomerDailyActiveIndexes(db);
    const at = input.at ?? new Date();
    const dayKey = argentinaDayKey(at);
    const atBsAs = argentinaIsoString(at);
    const phoneFingerprint = fingerprintPhoneDigitsForSessionAnalytics(input.phoneDigits);
    const name = input.customerName?.trim() || null;
    await db.collection(DAILY_ACTIVE_COLLECTION).updateOne(
      { dayKey, phoneFingerprint },
      {
        $setOnInsert: {
          dayKey,
          phoneFingerprint,
          firstSeenAt: at,
          firstSeenAtBsAs: atBsAs,
          firstSource: input.source,
          ...(name ? { customerName: name } : {}),
        },
        $set: {
          lastSeenAt: at,
          lastSeenAtBsAs: atBsAs,
          lastSource: input.source,
          ...(name ? { customerName: name } : {}),
        },
      },
      { upsert: true },
    );
  } catch (e) {
    console.error("[customer_daily_active_users]", e);
  }
}
