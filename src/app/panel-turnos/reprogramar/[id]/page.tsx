import { cookies } from "next/headers";
import { verifyPanelCookie } from "@/lib/panel-turnos-auth";
import { PanelLogin } from "../../panel-login";
import { ReprogramarTurnoClient } from "@/components/reprogramar-turno-client";

export default async function PanelReprogramarPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!verifyPanelCookie(cookieStore.get("panel_turnos_auth")?.value)) {
    return <PanelLogin />;
  }
  const { id } = await params;
  return <ReprogramarTurnoClient reservationId={id} variant="panel" />;
}
