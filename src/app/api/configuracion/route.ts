import { ActualizarOrganizacionSchema } from "@/core/entities/organizacion";
import { ok, manejarError } from "@/lib/api";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { crearOrganizacionRepo } from "@/infra/insforge/repos/organizacion-repo";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export async function GET() {
  try {
    const ctx = await getActiveContextOrThrow();
    return ok(ctx.organizacion);
  } catch (e) {
    return manejarError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") {
      throw new HttpError(403, "no_autorizado", "Solo administradores pueden editar la configuración");
    }
    const body = await req.json().catch(() => null);
    const parsed = ActualizarOrganizacionSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, "datos_invalidos", "Datos inválidos", parsed.error.flatten());
    }
    const repo = crearOrganizacionRepo(getInsforgeAdmin());
    const actualizada = await repo.actualizar(ctx.organizacion.id, parsed.data);
    return ok(actualizada);
  } catch (e) {
    return manejarError(e);
  }
}
