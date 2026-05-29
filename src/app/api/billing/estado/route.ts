import { ok, manejarError } from "@/lib/api";
import { getServerEnv } from "@/lib/env";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { obtenerEstadoBilling, inicioMesActualIso } from "@/infra/insforge/billing";
import { crearMensajeRepo } from "@/infra/insforge/repos/mensaje-repo";
import { getActiveContextOrThrow } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = await getActiveContextOrThrow();
    const env = getServerEnv();
    const admin = getInsforgeAdmin();
    const [billing, usadas] = await Promise.all([
      obtenerEstadoBilling(admin, ctx.organizacion.id, env.STRIPE_ENV),
      crearMensajeRepo(admin).contarEntrantesDesde(ctx.organizacion.id, inicioMesActualIso()),
    ]);
    return ok({
      estado: billing.estado,
      activo: billing.activo,
      plan: billing.plan
        ? { id: billing.plan.id, nombre: billing.plan.nombre, topeConversaciones: billing.plan.topeConversaciones }
        : null,
      vigenteHasta: billing.vigenteHasta,
      conversacionesUsadas: usadas,
    });
  } catch (e) {
    return manejarError(e);
  }
}
