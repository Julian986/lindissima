import TurnosClient from "./turnos-client";

type TurnosPageProps = {
  searchParams?: Promise<{
    treatment?: string;
  }>;
};

export default async function TurnosPage({ searchParams }: TurnosPageProps) {
  const params = (await searchParams) ?? {};

  return <TurnosClient initialTreatment={params.treatment} />;
}
