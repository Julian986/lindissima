import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyPanelPassword } from "@/lib/panel-turnos-auth";

export async function POST(request: Request) {
  const sessionToken = process.env.PANEL_TURNOS_SESSION_TOKEN;
  const passwordConfigured = Boolean(process.env.PANEL_TURNOS_PASSWORD);

  if (!sessionToken || !passwordConfigured) {
    return NextResponse.json(
      {
        error:
          "Panel no configurado (necesitás PANEL_TURNOS_PASSWORD y PANEL_TURNOS_SESSION_TOKEN).",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const p =
    typeof body === "object" && body !== null && "password" in body
      ? String((body as { password: unknown }).password ?? "")
      : "";

  if (!verifyPanelPassword(p)) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("panel_turnos_auth", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
