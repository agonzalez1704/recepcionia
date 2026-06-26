import { getActiveContextOrThrow } from "@/lib/tenant";
import { EquipoView } from "./view";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function EquipoPage() {
  const ctx = await getActiveContextOrThrow();
  const esAdmin = ctx.orgRole === "org:admin";
  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Equipo"
        descripcion="Profesionales que atienden en tu clínica. Cada uno tiene su propia agenda — los pacientes pueden agendar con un profesional en particular o con cualquiera."
      />
      {!esAdmin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Solo administradores pueden modificar el equipo.
        </div>
      )}
      <EquipoView readOnly={!esAdmin} servicios={ctx.organizacion.servicios.map((s) => s.nombre)} />
    </div>
  );
}
