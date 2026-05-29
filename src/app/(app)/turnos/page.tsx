import { getActiveContextOrThrow } from "@/lib/tenant";
import { TurnosView } from "./view";

export const dynamic = "force-dynamic";

export default async function TurnosPage() {
  const ctx = await getActiveContextOrThrow();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Turnos</h1>
        <p className="text-sm text-slate-600">Calendario y lista de turnos.</p>
      </header>
      <TurnosView zonaHoraria={ctx.organizacion.zona_horaria} />
    </div>
  );
}
