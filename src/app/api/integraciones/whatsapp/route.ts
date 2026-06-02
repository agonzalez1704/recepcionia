import { ok, manejarError } from "@/lib/api";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { crearIntegracionWhatsAppRepo } from "@/infra/insforge/repos/integracion-whatsapp-repo";
import { eliminarSender } from "@/infra/twilio/senders";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/** Estado de la integración WhatsApp de la org. */
export async function GET() {
  try {
    const ctx = await getActiveContextOrThrow();
    const repo = crearIntegracionWhatsAppRepo(getInsforgeAdmin());
    const integ = await repo.buscarPorOrg(ctx.organizacion.id);
    return ok(
      integ
        ? {
            numero_whatsapp: integ.numero_whatsapp,
            estado_sender: integ.estado_sender,
            pais: integ.pais,
            activo: integ.activo,
          }
        : null,
    );
  } catch (e) {
    return manejarError(e);
  }
}

/** Desconectar: elimina sender en Twilio + libera número + borra fila. */
export async function DELETE() {
  try {
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") throw new HttpError(403, "no_autorizado", "Solo administradores");
    const repo = crearIntegracionWhatsAppRepo(getInsforgeAdmin());
    const integ = await repo.buscarPorOrg(ctx.organizacion.id);
    if (integ?.sender_sid) {
      await eliminarSender(integ.sender_sid, integ.telefono_sid);
    }
    await repo.eliminar(ctx.organizacion.id);
    return ok({ eliminado: true });
  } catch (e) {
    return manejarError(e);
  }
}
