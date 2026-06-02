import { getServerEnv } from "@/lib/env";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { crearIntegracionGoogleRepo } from "@/infra/insforge/repos/integracion-google-repo";
import { activarWatch } from "@/infra/google/watch";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Renueva watch channels de Google que expiran pronto. Llamar desde un cron
 * (InsForge schedules) con header Authorization: Bearer <CRON_SECRET>.
 * Los canales de Google expiran (~7 días) y hay que recrearlos.
 */
export async function POST(req: Request) {
  const env = getServerEnv();
  const auth = req.headers.get("authorization");
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("No autorizado", { status: 401 });
  }

  const admin = getInsforgeAdmin();
  const repo = crearIntegracionGoogleRepo(admin);
  // Renovar los que vencen en las próximas 48h.
  const limite = new Date(Date.now() + 48 * 3600_000).toISOString();
  const porVencer = await repo.listarConCanalVencido(limite);

  let renovados = 0;
  for (const integ of porVencer) {
    try {
      await activarWatch(admin, integ);
      renovados++;
    } catch (err) {
      console.error(`Renovar watch ${integ.id} falló:`, err);
    }
  }

  return Response.json({ ok: true, renovados, evaluados: porVencer.length });
}
