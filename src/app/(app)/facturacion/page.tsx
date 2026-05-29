import { getActiveContextOrThrow } from "@/lib/tenant";
import { FacturacionView } from "./view";

export const dynamic = "force-dynamic";

export default async function FacturacionPage() {
  const ctx = await getActiveContextOrThrow();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Facturación</h1>
        <p className="text-sm text-slate-600">
          Tu plan, consumo del mes y gestión de la suscripción.
        </p>
      </header>
      <FacturacionView esAdmin={ctx.orgRole === "org:admin"} />
    </div>
  );
}
