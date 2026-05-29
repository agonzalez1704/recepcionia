import { getActiveContextOrThrow } from "@/lib/tenant";
import { EquipoView } from "./view";

export const dynamic = "force-dynamic";

export default async function EquipoPage() {
  const ctx = await getActiveContextOrThrow();
  const esAdmin = ctx.orgRole === "org:admin";
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Equipo</h1>
        <p className="text-sm text-slate-600">
          Profesionales que atienden en tu clínica. Cada uno tiene su propia agenda — los pacientes pueden agendar con vos en particular o con cualquiera.
        </p>
      </header>
      {!esAdmin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Solo administradores pueden modificar el equipo.
        </div>
      )}
      <EquipoView readOnly={!esAdmin} servicios={ctx.organizacion.servicios.map((s) => s.nombre)} />
    </div>
  );
}
