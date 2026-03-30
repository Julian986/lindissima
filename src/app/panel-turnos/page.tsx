import { cookies } from "next/headers";
import { verifyPanelCookie } from "@/lib/panel-turnos-auth";
import { PanelLogin } from "./panel-login";
import { PanelTurnosDashboard } from "./panel-turnos-dashboard";

export default async function PanelTurnosPage() {
  const cookieStore = await cookies();
  const ok = verifyPanelCookie(cookieStore.get("panel_turnos_auth")?.value);

  if (!ok) {
    return <PanelLogin />;
  }

  return <PanelTurnosDashboard />;
}
