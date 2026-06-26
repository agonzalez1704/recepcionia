import { z } from "zod";
import { ok, manejarError } from "@/lib/api";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { crearConversacionRepo } from "@/infra/insforge/repos/conversacion-repo";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

// Conversaciones en manos de un humano (bot pausado).
export async function GET() {
  try {
    const ctx = await getActiveContextOrThrow();
    const repo = crearConversacionRepo(getInsforgeAdmin());
    const conversaciones = await repo.listarHumanos(ctx.organizacion.id);
    return ok(conversaciones);
  } catch (e) {
    return manejarError(e);
  }
}

const PatchInput = z.object({
  numero: z.string().min(1),
  estado: z.enum(["bot", "humano"]),
  motivo: z.string().optional(),
});

// Reactivar el bot (estado=bot) o pausarlo manualmente (estado=humano).
export async function PATCH(req: Request) {
  try {
    const ctx = await getActiveContextOrThrow();
    const body = await req.json().catch(() => null);
    const parsed = PatchInput.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "datos_invalidos", "Datos inválidos");
    const repo = crearConversacionRepo(getInsforgeAdmin());
    if (parsed.data.estado === "bot") {
      await repo.marcarBot(ctx.organizacion.id, parsed.data.numero);
    } else {
      await repo.marcarHumano(ctx.organizacion.id, parsed.data.numero, parsed.data.motivo ?? "Pausado manualmente");
    }
    return ok({ ok: true });
  } catch (e) {
    return manejarError(e);
  }
}
