import type { InsForgeClient } from "@insforge/sdk";
import type { IntegracionGoogle } from "@/core/entities/integraciones";
import type { Turno } from "@/core/entities/turno";
import { crearIntegracionGoogleRepo } from "@/infra/insforge/repos/integracion-google-repo";
import { crearTurnoRepo } from "@/infra/insforge/repos/turno-repo";
import { listarCambios } from "@/infra/google/calendar";

/**
 * Procesa los cambios push de un calendario Google: detecta eventos externos
 * (bloqueos del profesional) que pisan turnos confirmados y los marca
 * 'necesita_reagendar'. Devuelve los turnos afectados.
 */
export async function procesarCambiosGoogle(
  admin: InsForgeClient,
  integ: IntegracionGoogle,
): Promise<{ afectados: Turno[] }> {
  const googleRepo = crearIntegracionGoogleRepo(admin);
  const turnoRepo = crearTurnoRepo(admin);

  let { cambios, nextSyncToken, resyncRequerido } = await listarCambios(integ);

  // Si el syncToken expiró, reseteamos y volvemos a pedir para obtener uno nuevo.
  if (resyncRequerido) {
    await googleRepo.actualizarCanal(integ.id, { sync_token: null });
    const fresco = await listarCambios({ ...integ, sync_token: null });
    cambios = fresco.cambios;
    nextSyncToken = fresco.nextSyncToken;
  }

  const afectados: Turno[] = [];
  const miembroId = integ.miembro_id ?? null;

  for (const ev of cambios) {
    // Solo eventos "ocupados" con horario concreto. Ignorar cancelados/all-day.
    if (ev.estado === "cancelled" || !ev.inicio || !ev.fin) continue;

    const inicio = new Date(ev.inicio).getTime();
    const fin = new Date(ev.fin).getTime();
    if (!Number.isFinite(inicio) || !Number.isFinite(fin)) continue;

    // Traer turnos del día que se solapan, del miembro de esta integración.
    const desde = new Date(inicio - 24 * 3600_000).toISOString();
    const hasta = new Date(fin + 24 * 3600_000).toISOString();
    const turnos = await turnoRepo.listar(integ.organizacion_id, {
      desde,
      hasta,
      miembroId: miembroId ?? undefined,
    });

    for (const t of turnos) {
      if (t.estado === "cancelado" || t.estado === "necesita_reagendar" || t.estado === "completado") continue;
      // Saltar si el evento ES el de este turno (lo creamos nosotros).
      if (t.google_event_id && t.google_event_id === ev.id) continue;
      // Para integración unificada, solo turnos sin miembro asignado.
      if (!miembroId && t.miembro_id) continue;

      const tIni = new Date(t.fecha_turno).getTime();
      const tFin = tIni + t.duracion_min * 60_000;
      const solapa = tIni < fin && inicio < tFin;
      if (solapa) {
        const actualizado = await turnoRepo.actualizar(integ.organizacion_id, t.id, {
          estado: "necesita_reagendar",
        });
        afectados.push(actualizado);
      }
    }
  }

  if (nextSyncToken) {
    await googleRepo.actualizarCanal(integ.id, { sync_token: nextSyncToken });
  }

  return { afectados };
}
