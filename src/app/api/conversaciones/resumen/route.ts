import { ok, manejarError } from "@/lib/api";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { crearConversacionRepo } from "@/infra/insforge/repos/conversacion-repo";
import { getActiveContextOrThrow } from "@/lib/tenant";

export const dynamic = "force-dynamic";

// Resumen de leads: una fila por conversación con métricas agregadas.
export async function GET() {
  try {
    const ctx = await getActiveContextOrThrow();
    const repo = crearConversacionRepo(getInsforgeAdmin());
    const conversaciones = await repo.resumen(ctx.organizacion.id);
    return ok(conversaciones);
  } catch (e) {
    return manejarError(e);
  }
}
