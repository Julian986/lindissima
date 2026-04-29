import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { deleteAgendaBlockByHexId, insertAgendaBlock } from "@/lib/booking/agenda-blocks";
import { getDb } from "@/lib/mongodb";
import { verifyPanelCookie } from "@/lib/panel-turnos-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!verifyPanelCookie(cookieStore.get("panel_turnos_auth")?.value)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const anchorDateKey = typeof b.anchorDateKey === "string" ? b.anchorDateKey.trim() : "";
  const timeLocal = typeof b.timeLocal === "string" ? b.timeLocal.trim() : "";
  const durationMinutes = Number(b.durationMinutes);
  const notes = b.notes == null ? null : typeof b.notes === "string" ? b.notes : null;

  const recurrenceType = typeof b.recurrenceType === "string" ? b.recurrenceType.trim() : "once";
  const untilDateKey =
    typeof b.untilDateKey === "string" && b.untilDateKey.trim() ? b.untilDateKey.trim() : null;

  if (!anchorDateKey || !timeLocal) {
    return NextResponse.json({ error: "Faltan datos obligatorios." }, { status: 400 });
  }

  let recurrence: null | { type: "weekly"; untilDateKey?: string | null } = null;
  if (recurrenceType === "weekly") {
    recurrence = { type: "weekly", untilDateKey: untilDateKey };
  } else if (recurrenceType !== "once") {
    return NextResponse.json({ error: "Tipo de recurrencia inválido." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const result = await insertAgendaBlock(db, {
      anchorDateKey,
      timeLocal,
      durationMinutes,
      scope: "salon",
      recurrence,
      notes,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
    }
    return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
  } catch (e) {
    console.error("[panel-turnos agenda-blocks POST]", e);
    return NextResponse.json({ error: "No se pudo crear el bloqueo." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  if (!verifyPanelCookie(cookieStore.get("panel_turnos_auth")?.value)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const ok = await deleteAgendaBlockByHexId(db, id);
    if (!ok) {
      return NextResponse.json({ error: "Bloqueo no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[panel-turnos agenda-blocks DELETE]", e);
    return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 });
  }
}
