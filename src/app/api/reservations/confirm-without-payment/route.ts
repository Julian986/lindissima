import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  confirmReservationWithoutPayment,
  findReservationByHexId,
} from "@/lib/reservations/service";

export const dynamic = "force-dynamic";

type Body = { reservationId?: string; checkoutToken?: string };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const reservationId = typeof body.reservationId === "string" ? body.reservationId.trim() : "";
  const checkoutToken = typeof body.checkoutToken === "string" ? body.checkoutToken.trim() : "";

  if (!reservationId || !checkoutToken) {
    return NextResponse.json({ error: "Faltan reservationId o checkoutToken." }, { status: 400 });
  }

  let oid: ObjectId;
  try {
    oid = new ObjectId(reservationId);
  } catch {
    return NextResponse.json({ error: "reservationId inválido." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const reservation = await findReservationByHexId(db, reservationId);
    if (!reservation || !reservation._id.equals(oid)) {
      return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
    }

    const out = await confirmReservationWithoutPayment(db, reservationId, checkoutToken);
    if (!out.ok) {
      const status =
        out.code === "TOKEN"
          ? 403
          : out.code === "STATE" || out.code === "EXPIRED"
            ? 409
            : out.code === "NOT_FOUND"
              ? 404
              : 400;
      return NextResponse.json({ error: out.error, code: out.code }, { status });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/reservations/confirm-without-payment POST]", e);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
