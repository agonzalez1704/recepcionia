import { z } from "zod";
import { ok, manejarError } from "@/lib/api";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { crearIntegracionWhatsAppRepo } from "@/infra/insforge/repos/integracion-whatsapp-repo";
import { verificarSender, estadoSender, mapearEstado } from "@/infra/twilio/senders";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const Input = z.object({ codigo: z.string().min(4).max(10) });

export async function POST(req: Request) {
  try {
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") throw new HttpError(403, "no_autorizado", "Solo administradores");
    const body = await req.json().catch(() => null);
    const parsed = Input.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "datos_invalidos", "Código inválido");

    const repo = crearIntegracionWhatsAppRepo(getInsforgeAdmin());
    const integ = await repo.buscarPorOrg(ctx.organizacion.id);
    if (!integ?.sender_sid) throw new HttpError(404, "sin_sender", "No hay un número en proceso de verificación");

    const { status } = await verificarSender(integ.sender_sid, parsed.data.codigo);
    const estado = mapearEstado(status);
    await repo.guardar(ctx.organizacion.id, { estado_sender: estado, activo: estado === "online" });
    return ok({ estado });
  } catch (e) {
    return manejarError(e);
  }
}

/** Sondear estado actual del sender (para revisión post-OTP). */
export async function GET() {
  try {
    const ctx = await getActiveContextOrThrow();
    const repo = crearIntegracionWhatsAppRepo(getInsforgeAdmin());
    const integ = await repo.buscarPorOrg(ctx.organizacion.id);
    if (!integ?.sender_sid) return ok({ estado: "sin_configurar" });
    const { status, offlineReasons } = await estadoSender(integ.sender_sid);
    const estado = mapearEstado(status);
    if (estado !== integ.estado_sender) {
      await repo.guardar(ctx.organizacion.id, { estado_sender: estado, activo: estado === "online" });
    }
    return ok({ estado, offlineReasons });
  } catch (e) {
    return manejarError(e);
  }
}
