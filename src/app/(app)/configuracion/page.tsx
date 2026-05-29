import { getActiveContextOrThrow } from "@/lib/tenant";
import { ConfiguracionForm } from "./form";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const ctx = await getActiveContextOrThrow();
  const esAdmin = ctx.orgRole === "org:admin";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Configuración de la clínica</h1>
        <p className="text-sm text-slate-600">
          Información, horarios y servicios. Estos datos los usa la IA para responder a tus pacientes.
        </p>
      </header>
      {!esAdmin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Solo los administradores de la clínica pueden editar la configuración. Vos podés verla.
        </div>
      )}
      <ConfiguracionForm organizacion={ctx.organizacion} readOnly={!esAdmin} />
    </div>
  );
}
