import { ok, manejarError } from "@/lib/api";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { crearMensajeRepo } from "@/infra/insforge/repos/mensaje-repo";
import { getActiveContextOrThrow } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const ctx = await getActiveContextOrThrow();
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);
    const numero = url.searchParams.get("numero") ?? undefined;
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const repo = crearMensajeRepo(getInsforgeAdmin());
    const mensajes = await repo.listar(ctx.organizacion.id, { limit, numero, cursor });
    return ok(mensajes);
  } catch (e) {
    return manejarError(e);
  }
}
