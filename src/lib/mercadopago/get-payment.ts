import type { MpPaymentPayload } from "@/lib/reservations/service";
import { mpFetchJson } from "./client";

type MpPaymentApi = {
  id: number;
  status: string;
  external_reference?: string | null;
};

export async function fetchMercadoPagoPayment(
  paymentId: string,
): Promise<{ ok: true; payment: MpPaymentPayload } | { ok: false; error: string }> {
  const r = await mpFetchJson<MpPaymentApi>(`/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
  });
  if (!r.ok) {
    return { ok: false, error: `MP payments GET ${r.status}: ${r.body}` };
  }
  const p = r.data;
  return {
    ok: true,
    payment: {
      id: p.id,
      status: p.status,
      external_reference: p.external_reference ?? undefined,
    },
  };
}
