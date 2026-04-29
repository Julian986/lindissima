import { cookies } from "next/headers";
import { verifyPanelCookie } from "@/lib/panel-turnos-auth";
import { PanelLogin } from "../panel-login";
import { PanelNuevoTurnoClient } from "./panel-nuevo-turno-client";

export default async function PanelNuevoPage() {
  const cookieStore = await cookies();
  if (!verifyPanelCookie(cookieStore.get("panel_turnos_auth")?.value)) {
    return <PanelLogin />;
  }
  return <PanelNuevoTurnoClient />;
}
