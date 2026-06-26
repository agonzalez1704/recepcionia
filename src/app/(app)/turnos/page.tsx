import { getActiveContextOrThrow } from "@/lib/tenant";
import { TurnosView } from "./view";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function TurnosPage() {
  const ctx = await getActiveContextOrThrow();
  return (
    <div className="space-y-6">
      <PageHeader titulo="Turnos" descripcion="Calendario y lista de turnos de tu clínica." />
      <TurnosView zonaHoraria={ctx.organizacion.zona_horaria} />
    </div>
  );
}
