import { NextResponse } from "next/server";

/**
 * Las reservas se crean como pendientes de pago en POST /api/reservations/pending
 * y se confirman solo vía webhook de Mercado Pago.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Este endpoint ya no confirma turnos directamente. Usá POST /api/reservations/pending y el flujo de Mercado Pago.",
      code: "USE_PENDING_FLOW",
    },
    { status: 410 },
  );
}
