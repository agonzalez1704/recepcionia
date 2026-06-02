import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { crearIntegracionGoogleRepo } from "@/infra/insforge/repos/integracion-google-repo";
import { procesarCambiosGoogle } from "@/infra/google/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Recibe push de Google Calendar. Headers:
 * - X-Goog-Channel-ID, X-Goog-Resource-ID, X-Goog-Resource-State (sync|exists|...)
 * Las notificaciones son "delgadas" → buscamos la integración y traemos el delta.
 */
export async function POST(req: Request) {
  const channelId = req.headers.get("x-goog-channel-id");
  const resourceId = req.headers.get("x-goog-resource-id");
  const state = req.headers.get("x-goog-resource-state");

  // 'sync' = handshake inicial al crear el canal. Nada que procesar.
  if (state === "sync" || !channelId || !resourceId) {
    return new Response(null, { status: 200 });
  }

  try {
    const admin = getInsforgeAdmin();
    const repo = crearIntegracionGoogleRepo(admin);
    const integ = await repo.buscarPorCanal(channelId, resourceId);
    if (!integ || !integ.activo) {
      // Canal desconocido/inactivo → 200 para que Google no reintente infinito.
      return new Response(null, { status: 200 });
    }
    const { afectados } = await procesarCambiosGoogle(admin, integ);
    if (afectados.length > 0) {
      console.log(`Google push: ${afectados.length} turno(s) marcados necesita_reagendar (org ${integ.organizacion_id})`);
    }
  } catch (err) {
    console.error("Error procesando push Google:", err);
    // 200 igual: Google reintenta agresivo ante errores; el cron de reconcile cubre.
  }
  return new Response(null, { status: 200 });
}
