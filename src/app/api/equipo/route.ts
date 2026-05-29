import { CrearMiembroSchema } from "@/core/entities/miembro";
import { crearMiembroRepo } from "@/infra/insforge/repos/miembro-repo";
import { ok, manejarError } from "@/lib/api";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = await getActiveContextOrThrow();
    const repo = crearMiembroRepo(getInsforgeAdmin());
    const miembros = await repo.listar(ctx.organizacion.id);
    return ok(miembros);
  } catch (e) {
    return manejarError(e);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") throw new HttpError(403, "no_autorizado", "Solo administradores");
    const body = await req.json().catch(() => null);
    const parsed = CrearMiembroSchema.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "datos_invalidos", "Datos inválidos", parsed.error.flatten());
    const repo = crearMiembroRepo(getInsforgeAdmin());
    const m = await repo.crear(ctx.organizacion.id, parsed.data);
    return ok(m, { status: 201 });
  } catch (e) {
    return manejarError(e);
  }
}
