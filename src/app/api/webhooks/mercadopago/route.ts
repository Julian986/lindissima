import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { logAndProcessMercadoPagoRequest } from "@/lib/mercadopago/process-notification";

export const dynamic = "force-dynamic";

function parseBodySnapshot(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { _raw: text.slice(0, 4000) };
  }
}

async function handle(request: Request, method: string) {
  const url = request.url;
  let bodySnapshot: unknown = null;
  if (method === "POST") {
    const text = await request.text();
    bodySnapshot = parseBodySnapshot(text);
  }

  try {
    const db = await getDb();
    await logAndProcessMercadoPagoRequest(db, method, url, bodySnapshot);
  } catch (e) {
    console.error("[webhooks/mercadopago]", e);
  }

  return new NextResponse(null, { status: 200 });
}

export async function GET(request: Request) {
  return handle(request, "GET");
}

export async function POST(request: Request) {
  return handle(request, "POST");
}
