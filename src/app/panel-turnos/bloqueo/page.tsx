import { cookies } from "next/headers";
import { verifyPanelCookie } from "@/lib/panel-turnos-auth";
import { PanelLogin } from "../panel-login";
import { PanelBloqueoAgendaClient } from "./panel-bloqueo-agenda-client";

export default async function PanelBloqueoPage() {
  const cookieStore = await cookies();
  if (!verifyPanelCookie(cookieStore.get("panel_turnos_auth")?.value)) {
    return <PanelLogin />;
  }
  return <PanelBloqueoAgendaClient />;
}
