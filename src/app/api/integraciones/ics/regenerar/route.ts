import { ok, manejarError } from "@/lib/api";
import { crearOrganizacionRepo } from "@/infra/insforge/repos/organizacion-repo";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") {
      throw new HttpError(403, "no_autorizado", "Solo administradores");
    }
    const repo = crearOrganizacionRepo(getInsforgeAdmin());
    const token = await repo.regenerarIcsToken(ctx.organizacion.id);
    const url = `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/calendario/${ctx.organizacion.slug}/${token}`;
    return ok({ token, url });
  } catch (e) {
    return manejarError(e);
  }
}
