import { ok, manejarError } from "@/lib/api";
import { obtenerOcupadosExternos } from "@/core/services/ocupados-externos";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const ctx = await getActiveContextOrThrow();
    const url = new URL(req.url);
    const desde = url.searchParams.get("desde");
    const hasta = url.searchParams.get("hasta");
    const miembroIdParam = url.searchParams.get("miembro_id");

    if (!desde || !hasta) throw new HttpError(400, "datos_invalidos", "desde y hasta son obligatorios");

    // Si no envían miembro_id → listar TODOS los calendarios para vista admin
    const listarTodos = miembroIdParam === null;
    const ocupados = await obtenerOcupadosExternos(ctx.organizacion.id, desde, hasta, {
      miembroId: miembroIdParam ?? null,
      listarTodos,
    });

    return ok(ocupados);
  } catch (e) {
    return manejarError(e);
  }
}
