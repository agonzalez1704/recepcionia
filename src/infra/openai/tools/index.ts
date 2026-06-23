import { parseISO } from "date-fns";
import { toZonedTime, format as formatTz } from "date-fns-tz";
import { calcularSlotsLibres, formatearSlotLocal } from "@/core/services/disponibilidad";
import { TurnoSolapadoError, type AgendarTurnoService } from "@/core/services/agendar-turno-service";
import { obtenerOcupadosExternos } from "@/core/services/ocupados-externos";
import type { TurnoRepo } from "@/core/ports/repos";
import type { ToolDef, ToolContext } from "@/core/ports/ia";
import type { Organizacion } from "@/core/entities/organizacion";
import type { Miembro } from "@/core/entities/miembro";

type DepsTools = {
  turnoRepo: TurnoRepo;
  agendarService: AgendarTurnoService;
  miembros: Miembro[];
};

function formatearFechaLocal(iso: string, tz: string): string {
  return formatTz(toZonedTime(new Date(iso), tz), "EEEE d 'de' MMMM 'a las' HH:mm");
}

function resolverMiembro(miembros: Miembro[], nombre?: string): Miembro | null {
  if (!nombre) return null;
  const n = nombre.trim().toLowerCase();
  // 1) match exacto  2) substring en cualquier dirección
  const directo =
    miembros.find((m) => m.nombre.toLowerCase() === n) ??
    miembros.find((m) => m.nombre.toLowerCase().includes(n) || n.includes(m.nombre.toLowerCase()));
  if (directo) return directo;

  // 3) match por tokens: el paciente puede decir solo apellido o nombre
  //    ("Carmona", "Dr Guillermo"). Ignoramos títulos genéricos.
  const STOP = new Set(["dr", "dra", "doctor", "doctora", "lic", "el", "la", "de"]);
  const tokensQuery = n.split(/\s+/).filter((t) => t.length >= 3 && !STOP.has(t));
  if (tokensQuery.length === 0) return null;
  const candidatos = miembros.filter((m) => {
    const tokensNombre = m.nombre.toLowerCase().split(/\s+/).filter((t) => !STOP.has(t));
    return tokensQuery.some((q) => tokensNombre.some((t) => t === q || t.startsWith(q) || q.startsWith(t)));
  });
  // Solo resolvemos si es inequívoco (un único profesional coincide).
  return candidatos.length === 1 ? candidatos[0] : null;
}

function ctxMiembro(_ctx: ToolContext, miembros: Miembro[], nombre?: string): Miembro | null {
  return resolverMiembro(miembros, nombre);
}

// =================== consultar_disponibilidad ===================

export function consultarDisponibilidadTool(deps: DepsTools): ToolDef<
  { fecha: string; servicio?: string; miembro?: string },
  { slots: string[]; mensaje: string; miembro?: string }
> {
  return {
    nombre: "consultar_disponibilidad",
    descripcion:
      "Devuelve horarios libres para una fecha. Si especificás 'miembro', usa la agenda de ese profesional; si no, usa la agenda general de la clínica.",
    parametros: {
      type: "object",
      properties: {
        fecha: { type: "string", description: "Fecha YYYY-MM-DD" },
        servicio: { type: "string", description: "Nombre del servicio (opcional)" },
        miembro: { type: "string", description: "Nombre del profesional (opcional)" },
      },
      required: ["fecha"],
      additionalProperties: false,
    },
    async ejecutar({ fecha, servicio, miembro }, ctx) {
      const org = ctx.organizacion;
      const duracion = resolverDuracion(org, servicio);
      const miembroObj = ctxMiembro(ctx, deps.miembros, miembro);

      const desde = new Date(parseISO(fecha + "T00:00:00Z").getTime() - 24 * 3600_000).toISOString();
      const hasta = new Date(parseISO(fecha + "T00:00:00Z").getTime() + 48 * 3600_000).toISOString();
      const [turnos, ocupadosExternos] = await Promise.all([
        deps.turnoRepo.listar(org.id, { desde, hasta, miembroId: miembroObj?.id }),
        obtenerOcupadosExternos(org.id, desde, hasta, { miembroId: miembroObj?.id ?? null }),
      ]);
      const slots = calcularSlotsLibres(org, fecha, duracion, turnos, { miembro: miembroObj, ocupadosExternos });

      const conMiembro = miembroObj ? ` con ${miembroObj.nombre}` : "";
      if (slots.length === 0) {
        return {
          slots,
          mensaje: `No hay horarios disponibles${conMiembro} ese día.`,
          miembro: miembroObj?.nombre,
        };
      }
      const horarios = slots.map((s) => formatearSlotLocal(s, org.zona_horaria)).join(", ");
      return { slots, mensaje: `Horarios disponibles${conMiembro}: ${horarios}.`, miembro: miembroObj?.nombre };
    },
  };
}

// =================== ver_turnos_paciente ===================

export function verTurnosPacienteTool(deps: DepsTools): ToolDef<
  Record<string, never>,
  { turnos: { id: string; cuando: string; servicio: string; estado: string; miembro?: string }[] }
> {
  return {
    nombre: "ver_turnos_paciente",
    descripcion: "Devuelve los turnos no cancelados del paciente que envió el mensaje.",
    parametros: { type: "object", properties: {}, additionalProperties: false },
    async ejecutar(_input, ctx) {
      const turnos = await deps.turnoRepo.listarPorTelefono(ctx.organizacion.id, ctx.numeroPaciente);
      return {
        turnos: turnos.map((t) => ({
          id: t.id,
          cuando: formatearFechaLocal(t.fecha_turno, ctx.organizacion.zona_horaria),
          servicio: t.servicio,
          estado: t.estado,
          miembro: t.miembro_id ? deps.miembros.find((m) => m.id === t.miembro_id)?.nombre : undefined,
        })),
      };
    },
  };
}

// =================== listar_miembros ===================

export function listarMiembrosTool(deps: DepsTools): ToolDef<
  Record<string, never>,
  { miembros: { nombre: string; rol?: string; especialidad?: string; bio?: string; servicios?: string[] }[] }
> {
  return {
    nombre: "listar_miembros",
    descripcion:
      "Lista los profesionales/staff disponibles en la clínica con su especialidad. Usá esta tool para recomendar al profesional correcto según lo que necesita el paciente, o si el paciente pide ver con quién puede agendar.",
    parametros: { type: "object", properties: {}, additionalProperties: false },
    async ejecutar() {
      return {
        miembros: deps.miembros
          .filter((m) => m.activo)
          .map((m) => ({
            nombre: m.nombre,
            rol: m.rol ?? undefined,
            especialidad: m.especialidad ?? undefined,
            bio: m.bio ?? undefined,
            servicios: m.servicios.length ? m.servicios : undefined,
          })),
      };
    },
  };
}

// =================== agendar_turno ===================

export function agendarTurnoTool(deps: DepsTools): ToolDef<
  { nombre_paciente: string; fecha_turno: string; servicio?: string; notas?: string; miembro?: string },
  { ok: boolean; id?: string; mensaje: string }
> {
  return {
    nombre: "agendar_turno",
    descripcion:
      "Agenda un turno nuevo. Devuelve ok=false si el horario está ocupado para el profesional indicado. La fecha debe ser ISO 8601 con timezone. SIEMPRE incluí 'nombre_paciente' (preguntalo si no lo sabés), 'notas' (resumen breve del motivo/síntomas) y 'miembro' (nombre exacto del profesional con quien se agenda, salvo que la clínica no tenga profesionales cargados).",
    parametros: {
      type: "object",
      properties: {
        nombre_paciente: { type: "string", description: "Nombre completo del paciente. Obligatorio. Si no lo tienes, pregúntalo antes de llamar a esta tool." },
        fecha_turno: { type: "string", description: "ISO 8601 con timezone" },
        servicio: { type: "string", description: "Servicio solicitado" },
        notas: { type: "string", description: "Resumen breve del motivo de consulta o síntomas mencionados por el paciente (ej. 'dolor de panza desde ayer', 'control anual', 'limpieza dental')." },
        miembro: { type: "string", description: "Nombre del profesional (opcional)" },
      },
      required: ["nombre_paciente", "fecha_turno", "notas"],
      additionalProperties: false,
    },
    async ejecutar(input, ctx) {
      try {
        const miembroObj = ctxMiembro(ctx, deps.miembros, input.miembro);
        const turno = await deps.agendarService.agendar({
          numero_telefono: ctx.numeroPaciente,
          nombre_paciente: input.nombre_paciente,
          fecha_turno: new Date(input.fecha_turno).toISOString(),
          servicio: input.servicio,
          notas: input.notas,
          miembro_id: miembroObj?.id ?? null,
        });
        const conMiembro = miembroObj ? ` con ${miembroObj.nombre}` : "";
        return {
          ok: true,
          id: turno.id,
          mensaje: `Turno confirmado${conMiembro} para ${formatearFechaLocal(turno.fecha_turno, ctx.organizacion.zona_horaria)}.`,
        };
      } catch (err) {
        if (err instanceof TurnoSolapadoError) return { ok: false, mensaje: "Ese horario ya está ocupado." };
        throw err;
      }
    },
  };
}

// =================== cancelar_turno ===================

export function cancelarTurnoTool(deps: DepsTools): ToolDef<{ id_turno: string }, { ok: boolean; mensaje: string }> {
  return {
    nombre: "cancelar_turno",
    descripcion: "Cancela un turno existente del paciente. Obtené id_turno de ver_turnos_paciente primero.",
    parametros: {
      type: "object",
      properties: { id_turno: { type: "string" } },
      required: ["id_turno"],
      additionalProperties: false,
    },
    async ejecutar({ id_turno }) {
      await deps.agendarService.cancelar(id_turno);
      return { ok: true, mensaje: "Turno cancelado." };
    },
  };
}

// =================== reprogramar_turno ===================

export function reprogramarTurnoTool(deps: DepsTools): ToolDef<{ id_turno: string; nueva_fecha: string }, { ok: boolean; mensaje: string }> {
  return {
    nombre: "reprogramar_turno",
    descripcion: "Reprograma un turno a una nueva fecha/hora. Obtené id_turno de ver_turnos_paciente primero.",
    parametros: {
      type: "object",
      properties: {
        id_turno: { type: "string" },
        nueva_fecha: { type: "string", description: "ISO 8601 con timezone" },
      },
      required: ["id_turno", "nueva_fecha"],
      additionalProperties: false,
    },
    async ejecutar({ id_turno, nueva_fecha }, ctx) {
      try {
        const t = await deps.agendarService.reprogramar(id_turno, new Date(nueva_fecha).toISOString());
        return { ok: true, mensaje: `Turno reprogramado para ${formatearFechaLocal(t.fecha_turno, ctx.organizacion.zona_horaria)}.` };
      } catch (err) {
        if (err instanceof TurnoSolapadoError) return { ok: false, mensaje: "Ese horario ya está ocupado." };
        throw err;
      }
    },
  };
}

function resolverDuracion(org: Organizacion, servicioNombre?: string): number {
  if (!servicioNombre) return org.servicios[0]?.duracion_min ?? 30;
  const s = org.servicios.find((x) => x.nombre.toLowerCase() === servicioNombre.toLowerCase());
  return s?.duracion_min ?? 30;
}
