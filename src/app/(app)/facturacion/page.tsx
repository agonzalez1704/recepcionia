import { getActiveContextOrThrow } from "@/lib/tenant";
import { FacturacionView } from "./view";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function FacturacionPage() {
  const ctx = await getActiveContextOrThrow();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader titulo="Facturación" descripcion="Tu plan, consumo del mes y gestión de la suscripción." />
      <FacturacionView esAdmin={ctx.orgRole === "org:admin"} />
    </div>
  );
}
