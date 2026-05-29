import type { Ocupado } from "../ports/calendar";
import { crearIntegracionGoogleRepo } from "@/infra/insforge/repos/integracion-google-repo";
import { crearCalendarProviderGoogle } from "@/infra/google/calendar";
import { getInsforgeAdmin } from "@/lib/insforge-admin";

export type OcupadoExterno = Ocupado & {
  fuente: "google";
  miembro_id: string | null;
};

/**
 * Devuelve rangos ocupados de calendarios externos.
 * - Si miembroId presente: integración propia del miembro (si existe) + unificada.
 * - Si miembroId null: solo unificada.
 * - Si listarTodos=true: TODAS las integraciones activas de la org.
 */
export async function obtenerOcupadosExternos(
  orgId: string,
  desde: string,
  hasta: string,
  opts: { miembroId?: string | null; listarTodos?: boolean } = {},
): Promise<OcupadoExterno[]> {
  const repo = crearIntegracionGoogleRepo(getInsforgeAdmin());
  const todas = await repo.listarPorOrg(orgId);
  const activas = todas.filter((i) => i.activo);

  let aplicables = activas;
  if (!opts.listarTodos) {
    if (opts.miembroId) {
      // Integración propia del miembro + unificada
      aplicables = activas.filter((i) => i.miembro_id === opts.miembroId || i.miembro_id === null);
    } else {
      // Solo unificada
      aplicables = activas.filter((i) => i.miembro_id === null);
    }
  }

  const resultados: OcupadoExterno[] = [];
  await Promise.all(
    aplicables.map(async (integ) => {
      try {
        const provider = crearCalendarProviderGoogle(integ);
        const busy = await provider.consultarOcupados(desde, hasta);
        for (const b of busy) {
          resultados.push({ ...b, fuente: "google", miembro_id: integ.miembro_id ?? null });
        }
      } catch (err) {
        console.error(`Calendar provider ${integ.id} (${integ.email_google}) falló:`, err);
      }
    }),
  );

  return resultados;
}
