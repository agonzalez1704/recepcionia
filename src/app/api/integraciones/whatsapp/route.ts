import { ok, manejarError } from "@/lib/api";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { crearIntegracionWhatsAppRepo } from "@/infra/insforge/repos/integracion-whatsapp-repo";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/** Estado de la integración WhatsApp (modelo Kapso) de la org. */
export async function GET() {
  try {
    const ctx = await getActiveContextOrThrow();
    const repo = crearIntegracionWhatsAppRepo(getInsforgeAdmin());
    const integ = await repo.buscarPorOrg(ctx.organizacion.id);
    return ok(
      integ
        ? {
            numero_whatsapp: integ.display_phone_number ?? integ.numero_whatsapp,
            estado_sender: integ.estado_sender,
            connection_type: integ.connection_type,
            conectado: integ.estado_sender === "online" && integ.activo,
          }
        : null,
    );
  } catch (e) {
    return manejarError(e);
  }
}

/** Desconectar: borra la fila (el número queda en Kapso; se puede reconectar). */
export async function DELETE() {
  try {
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") throw new HttpError(403, "no_autorizado", "Solo administradores");
    const repo = crearIntegracionWhatsAppRepo(getInsforgeAdmin());
    await repo.eliminar(ctx.organizacion.id);
    return ok({ eliminado: true });
  } catch (e) {
    return manejarError(e);
  }
}
