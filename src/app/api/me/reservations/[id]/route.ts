import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { canonicalPhoneDigitsAR, customerPhoneDigitsQueryValues } from "@/lib/customer/phone-canonical-ar";
import { CUSTOMER_PROFILE_COOKIE, readCustomerProfilePhoneDigits } from "@/lib/customer/customer-session";
import { getDb } from "@/lib/mongodb";
import { serializeReservationForCustomer } from "@/lib/reservations/customer-public-serialize";
import {
  cancelReservation,
  ensureReservationIndexes,
  findReservationByHexId,
  rescheduleReservation,
} from "@/lib/reservations/service";

export const dynamic = "force-dynamic";

function statusFromCode(code: string | undefined): number {
  switch (code) {
    case "NOT_FOUND":    return 404;
    case "UNAUTHORIZED": return 401;
    case "FORBIDDEN":    return 403;
    case "NOT_MOVABLE":
    case "NOT_CANCELLABLE":
    case "SLOT_UNAVAILABLE":
    case "CONFLICT":     return 409;
    default:             return 400;
  }
}

async function getDigitsFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CUSTOMER_PROFILE_COOKIE)?.value;
  const fromCookie = readCustomerProfilePhoneDigits(raw);
  if (!fromCookie) return null;
  return canonicalPhoneDigitsAR(fromCookie) || null;
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const digits = await getDigitsFromCookie();
  if (!digits) return NextResponse.json({ error: "No iniciaste sesión." }, { status: 401 });

  try {
    const db = await getDb();
    await ensureReservationIndexes(db);
    const doc = await findReservationByHexId(db, id.trim());
    if (!doc) return NextResponse.json({ error: "No encontrado. Ir a acceso" }, { status: 404 });
    const docDigits = doc.customerPhoneDigits ?? canonicalPhoneDigitsAR(doc.customerPhone);
    if (!customerPhoneDigitsQueryValues(digits).includes(docDigits)) {
      return NextResponse.json({ error: "No encontrado. Ir a acceso" }, { status: 404 });
    }
    return NextResponse.json(serializeReservationForCustomer(doc));
  } catch (e) {
    console.error("[api/me/reservations/[id] GET]", e);
    return NextResponse.json({ error: "No se pudo cargar el turno." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const digits = await getDigitsFromCookie();
  if (!digits) return NextResponse.json({ error: "No iniciaste sesión." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const dateKey =
    typeof body === "object" && body && "dateKey" in body
      ? String((body as { dateKey: unknown }).dateKey ?? "").trim()
      : "";
  const timeLocal =
    typeof body === "object" && body && "timeLocal" in body
      ? String((body as { timeLocal: unknown }).timeLocal ?? "").trim()
      : "";

  try {
    const db = await getDb();
    const result = await rescheduleReservation(db, {
      reservationHexId: id.trim(),
      newDateKey: dateKey,
      newTimeLocal: timeLocal,
      now: new Date(),
      actor: "customer",
      customerCanonicalDigits: digits,
    });
    if ("error" in result) {
      const status = ["FORBIDDEN", "NOT_FOUND"].includes(result.code ?? "") ? 404 : statusFromCode(result.code);
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/me/reservations/[id] PATCH]", e);
    return NextResponse.json({ error: "No se pudo actualizar el turno." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const digits = await getDigitsFromCookie();
  if (!digits) return NextResponse.json({ error: "No iniciaste sesión." }, { status: 401 });

  let body: unknown = null;
  try { body = await request.json(); } catch { body = null; }
  const cancelReason =
    typeof body === "object" && body && "cancelReason" in body
      ? String((body as { cancelReason: unknown }).cancelReason ?? "").trim()
      : "";

  try {
    const db = await getDb();
    const result = await cancelReservation(db, {
      reservationHexId: id.trim(),
      now: new Date(),
      actor: "customer",
      customerCanonicalDigits: digits,
      cancelReason: cancelReason || undefined,
    });
    if ("error" in result) {
      const status = ["FORBIDDEN", "NOT_FOUND"].includes(result.code ?? "") ? 404 : statusFromCode(result.code);
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/me/reservations/[id] DELETE]", e);
    return NextResponse.json({ error: "No se pudo cancelar el turno." }, { status: 500 });
  }
}
