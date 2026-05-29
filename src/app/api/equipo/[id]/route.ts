import { ActualizarMiembroSchema } from "@/core/entities/miembro";
import { crearMiembroRepo } from "@/infra/insforge/repos/miembro-repo";
import { ok, manejarError } from "@/lib/api";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") throw new HttpError(403, "no_autorizado", "Solo administradores");
    const body = await req.json().catch(() => null);
    const parsed = ActualizarMiembroSchema.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "datos_invalidos", "Datos inválidos", parsed.error.flatten());
    const repo = crearMiembroRepo(getInsforgeAdmin());
    const m = await repo.actualizar(ctx.organizacion.id, id, parsed.data);
    return ok(m);
  } catch (e) {
    return manejarError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") throw new HttpError(403, "no_autorizado", "Solo administradores");
    const repo = crearMiembroRepo(getInsforgeAdmin());
    await repo.eliminar(ctx.organizacion.id, id);
    return ok({ eliminado: true });
  } catch (e) {
    return manejarError(e);
  }
}
