import type { ReservationDoc } from "@/lib/reservations/types";
import { getAppBaseUrl, getDepositAmountArs } from "./config";
import { mpFetchJson } from "./client";

export type PreferenceResponse = {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
};

type PreferenceBody = {
  items: { title: string; quantity: number; unit_price: number; currency_id: string }[];
  external_reference: string;
  notification_url: string;
  back_urls: { success: string; failure: string; pending: string };
  auto_return?: string;
};

export async function createCheckoutProPreference(
  reservation: ReservationDoc,
): Promise<{ ok: true; preference: PreferenceResponse } | { ok: false; error: string }> {
  const base = getAppBaseUrl();
  const amount = getDepositAmountArs();
  const ext = reservation.externalReference ?? reservation._id.toHexString();

  const body: PreferenceBody = {
    items: [
      {
        title: `Seña reserva · ${reservation.treatmentName}`,
        quantity: 1,
        unit_price: amount,
        currency_id: "ARS",
      },
    ],
    external_reference: ext,
    notification_url: `${base}/api/webhooks/mercadopago`,
    back_urls: {
      success: `${base}/turnos/pago-retorno?estado=success`,
      failure: `${base}/turnos/pago-retorno?estado=failure`,
      pending: `${base}/turnos/pago-retorno?estado=pending`,
    },
    auto_return: "approved",
  };

  const r = await mpFetchJson<PreferenceResponse>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    return { ok: false, error: `MP preferences POST failed ${r.status}: ${r.body}` };
  }

  const data = r.data;
  if (!data.id || !data.init_point) {
    return { ok: false, error: "Respuesta de MP sin id o init_point" };
  }

  return { ok: true, preference: data };
}
