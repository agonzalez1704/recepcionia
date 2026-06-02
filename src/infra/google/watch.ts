import { randomUUID } from "node:crypto";
import type { InsForgeClient } from "@insforge/sdk";
import type { IntegracionGoogle } from "@/core/entities/integraciones";
import { crearIntegracionGoogleRepo } from "@/infra/insforge/repos/integracion-google-repo";
import { registrarWatch, detenerWatch, listarCambios } from "@/infra/google/calendar";
import { getServerEnv } from "@/lib/env";

/**
 * Activa (o reactiva) el watch channel de una integración Google:
 * detiene el anterior, crea uno nuevo, y obtiene el syncToken inicial.
 */
export async function activarWatch(admin: InsForgeClient, integ: IntegracionGoogle): Promise<void> {
  const env = getServerEnv();
  const repo = crearIntegracionGoogleRepo(admin);
  const webhookUrl = `${env.APP_BASE_URL}/api/webhooks/google`;

  // Detener canal previo si existe.
  if (integ.canal_id) {
    await detenerWatch(integ);
  }

  const channelId = randomUUID();
  try {
    const { resourceId, expiration } = await registrarWatch(integ, webhookUrl, channelId);
    const expiraIso = expiration ? new Date(Number(expiration)).toISOString() : null;

    // syncToken inicial (timeMin=now) para tener línea base.
    const base = await listarCambios({ ...integ, sync_token: null });

    await repo.actualizarCanal(integ.id, {
      canal_id: channelId,
      resource_id: resourceId,
      canal_expira_en: expiraIso,
      sync_token: base.nextSyncToken ?? null,
    });
  } catch (err) {
    console.error("No se pudo activar watch Google:", err);
  }
}
