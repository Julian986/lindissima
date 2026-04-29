import { Suspense } from "react";

import { MisTurnosClient } from "./mis-turnos-client";

export default function MisTurnosPage() {
  return (
    <Suspense>
      <MisTurnosClient />
    </Suspense>
  );
}
