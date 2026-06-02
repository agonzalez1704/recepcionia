import { getActiveContextOrThrow } from "@/lib/tenant";
import { IntegracionesView } from "./view";

export const dynamic = "force-dynamic";

export default async function IntegracionesPage() {
  const ctx = await getActiveContextOrThrow();
  const esAdmin = ctx.orgRole === "org:admin";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Integraciones</h1>
        <p className="text-sm text-slate-600">Conectá WhatsApp, Google Calendar y el feed para iOS.</p>
      </header>
      {!esAdmin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Solo administradores pueden modificar integraciones.
        </div>
      )}
      <IntegracionesView readOnly={!esAdmin} />
    </div>
  );
}
