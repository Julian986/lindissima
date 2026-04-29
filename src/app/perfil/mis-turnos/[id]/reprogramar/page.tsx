import { ReprogramarTurnoClient } from "@/components/reprogramar-turno-client";

export default async function ReprogramarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReprogramarTurnoClient reservationId={id} />;
}
