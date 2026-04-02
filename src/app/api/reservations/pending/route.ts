import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { parseCreateReservationBody } from "@/lib/reservations/parse-body";
import { insertPendingReservation } from "@/lib/reservations/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = parseCreateReservationBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.message }, { status: 400 });
  }

  try {
    const db = await getDb();
    const result = await insertPendingReservation(db, parsed.value);

    if ("error" in result) {
      const status = result.code === "SLOT_TAKEN" ? 409 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    return NextResponse.json(
      {
        id: result.id,
        checkoutToken: result.checkoutToken,
        externalReference: result.externalReference,
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("[api/reservations/pending POST]", e);
    return NextResponse.json(
      { error: "No se pudo crear la reserva pendiente. Probá de nuevo en unos minutos." },
      { status: 500 },
    );
  }
}
