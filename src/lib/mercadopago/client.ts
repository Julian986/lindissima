import { getMercadoPagoAccessToken } from "./config";

const MP_API = "https://api.mercadopago.com";

export async function mpFetchJson<T>(
  path: string,
  init?: RequestInit & { method?: string },
): Promise<{ ok: true; data: T } | { ok: false; status: number; body: string }> {
  const token = getMercadoPagoAccessToken();
  const url = path.startsWith("http") ? path : `${MP_API}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, body: text.slice(0, 2000) };
  }
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, status: res.status, body: text.slice(0, 2000) };
  }
}
