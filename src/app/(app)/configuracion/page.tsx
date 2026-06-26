import { getActiveContextOrThrow } from "@/lib/tenant";
import { ConfiguracionForm } from "./form";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const ctx = await getActiveContextOrThrow();
  const esAdmin = ctx.orgRole === "org:admin";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        titulo="Configuración de la clínica"
        descripcion="Información, horarios y servicios. Estos datos los usa la IA para responder a tus pacientes."
      />
      {!esAdmin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Solo los administradores de la clínica pueden editar la configuración. Vos podés verla.
        </div>
      )}
      <ConfiguracionForm organizacion={ctx.organizacion} readOnly={!esAdmin} />
    </div>
  );
}
