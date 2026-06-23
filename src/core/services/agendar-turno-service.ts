import type { TurnoRepo } from "../ports/repos";
import type { CalendarProvider } from "../ports/calendar";
import type { Organizacion, Servicio } from "../entities/organizacion";
import type { Miembro } from "../entities/miembro";
import type { Turno } from "../entities/turno";
import { obtenerOcupadosExternos } from "./ocupados-externos";

export type AgendarInput = {
  numero_telefono: string;
  nombre_paciente: string;
  fecha_turno: string;
  servicio?: string;
  notas?: string;
  miembro_id?: string | null;
};

export type ResolverCalendar = (miembroId: string | null) => Promise<CalendarProvider | null>;

export type AgendarTurnoDeps = {
  turnoRepo: TurnoRepo;
  /** Función que devuelve el CalendarProvider correcto según el miembro_id del turno. */
  resolverCalendar?: ResolverCalendar;
  /** Provider fijo (backwards-compat, ignora miembro). Si está, se usa siempre. */
  calendarProvider?: CalendarProvider | null;
  organizacion: Organizacion;
  miembros?: Miembro[];
};

export class TurnoSolapadoError extends Error {
  constructor() {
    super("Ese horario ya está ocupado");
  }
}

function resolverServicio(org: Organizacion, nombre?: string): { nombre: string; duracion_min: number } {
  if (!nombre) {
    const primero = org.servicios[0];
    return { nombre: primero?.nombre ?? "Consulta", duracion_min: primero?.duracion_min ?? 30 };
  }
  const match = org.servicios.find((s: Servicio) => s.nombre.toLowerCase() === nombre.toLowerCase());
  if (match) return { nombre: match.nombre, duracion_min: match.duracion_min };
  return { nombre, duracion_min: 30 };
}

export function crearAgendarTurnoService(deps: AgendarTurnoDeps) {
  const { turnoRepo, organizacion } = deps;

  async function calendarFor(miembroId: string | null): Promise<CalendarProvider | null> {
    if (deps.resolverCalendar) return deps.resolverCalendar(miembroId);
    return deps.calendarProvider ?? null;
  }

  return {
    async agendar(input: AgendarInput): Promise<Turno> {
      const servicio = resolverServicio(organizacion, input.servicio);
      const solapa = await turnoRepo.haySolapamiento(organizacion.id, input.fecha_turno, servicio.duracion_min, {
        miembroId: input.miembro_id ?? null,
      });
      if (solapa) throw new TurnoSolapadoError();

      // Verificar conflicto con eventos externos (Google Calendar)
      const inicio = new Date(input.fecha_turno).getTime();
      const fin = inicio + servicio.duracion_min * 60_000;
      const externos = await obtenerOcupadosExternos(
        organizacion.id,
        new Date(inicio - 60_000).toISOString(),
        new Date(fin + 60_000).toISOString(),
        { miembroId: input.miembro_id ?? null },
      );
      const conflicto = externos.some((e) => {
        const a = new Date(e.inicio).getTime();
        const b = new Date(e.fin).getTime();
        return a < fin && inicio < b;
      });
      if (conflicto) throw new TurnoSolapadoError();

      const turno = await turnoRepo.crear(organizacion.id, {
        numero_telefono: input.numero_telefono,
        nombre_paciente: input.nombre_paciente,
        fecha_turno: input.fecha_turno,
        duracion_min: servicio.duracion_min,
        servicio: servicio.nombre,
        notas: input.notas,
        miembro_id: input.miembro_id ?? null,
        estado: "confirmado",
      });

      const calendar = await calendarFor(input.miembro_id ?? null);
      if (calendar) {
        try {
          const inicio = new Date(turno.fecha_turno).toISOString();
          const fin = new Date(new Date(turno.fecha_turno).getTime() + turno.duracion_min * 60_000).toISOString();
          const eventId = await calendar.crearEvento({
            inicio,
            fin,
            titulo: `${turno.servicio} — ${turno.nombre_paciente}`,
            descripcion: `Paciente: ${turno.nombre_paciente}\nTeléfono: ${turno.numero_telefono}\n${turno.notas ?? ""}`,
          });
          // Persistir el event id para poder sincronizar cancelaciones/reprogramaciones después.
          return await turnoRepo.actualizar(organizacion.id, turno.id, { google_event_id: eventId });
        } catch (err) {
          console.error("Sync Google falló (turno creado igual):", err);
        }
      }

      return turno;
    },

    async cancelar(turnoId: string): Promise<Turno> {
      const turno = await turnoRepo.buscarPorId(organizacion.id, turnoId);
      if (!turno) throw new Error("Turno no encontrado");
      const actualizado = await turnoRepo.actualizar(organizacion.id, turnoId, { estado: "cancelado" });
      if (turno.google_event_id) {
        const calendar = await calendarFor(turno.miembro_id ?? null);
        if (calendar) {
          try {
            await calendar.eliminarEvento(turno.google_event_id);
          } catch (err) {
            console.error("No se pudo borrar evento Google:", err);
          }
        }
      }
      return actualizado;
    },

    async reprogramar(turnoId: string, nuevaFechaISO: string): Promise<Turno> {
      const turno = await turnoRepo.buscarPorId(organizacion.id, turnoId);
      if (!turno) throw new Error("Turno no encontrado");
      const solapa = await turnoRepo.haySolapamiento(organizacion.id, nuevaFechaISO, turno.duracion_min, {
        excluirId: turnoId,
        miembroId: turno.miembro_id ?? null,
      });
      if (solapa) throw new TurnoSolapadoError();
      const actualizado = await turnoRepo.actualizar(organizacion.id, turnoId, { fecha_turno: nuevaFechaISO });

      if (turno.google_event_id) {
        const calendar = await calendarFor(turno.miembro_id ?? null);
        if (calendar) {
          try {
            const fin = new Date(new Date(nuevaFechaISO).getTime() + turno.duracion_min * 60_000).toISOString();
            await calendar.actualizarEvento(turno.google_event_id, {
              inicio: nuevaFechaISO,
              fin,
              titulo: `${turno.servicio} — ${turno.nombre_paciente}`,
            });
          } catch (err) {
            console.error("Sync Google falló:", err);
          }
        }
      }
      return actualizado;
    },
  };
}

export type AgendarTurnoService = ReturnType<typeof crearAgendarTurnoService>;
