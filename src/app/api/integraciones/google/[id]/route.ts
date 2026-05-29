import { crearIntegracionGoogleRepo } from "@/infra/insforge/repos/integracion-google-repo";
import { ok, manejarError } from "@/lib/api";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") throw new HttpError(403, "no_autorizado", "Solo administradores");
    const repo = crearIntegracionGoogleRepo(getInsforgeAdmin());
    const todas = await repo.listarPorOrg(ctx.organizacion.id);
    const target = todas.find((t) => t.id === id);
    if (!target) throw new HttpError(404, "no_encontrado", "Integración no encontrada");
    await repo.eliminar(id);
    return ok({ eliminado: true });
  } catch (e) {
    return manejarError(e);
  }
}
