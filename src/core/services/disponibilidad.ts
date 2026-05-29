import { fromZonedTime, toZonedTime, format as formatTz } from "date-fns-tz";
import type { Horario, Organizacion } from "../entities/organizacion";
import type { Miembro } from "../entities/miembro";
import type { Turno } from "../entities/turno";
import type { Ocupado } from "../ports/calendar";

const DIAS_INDEX: Record<Horario["dia"], number> = {
  dom: 0,
  lun: 1,
  mar: 2,
  mie: 3,
  jue: 4,
  vie: 5,
  sab: 6,
};

/**
 * Devuelve slots libres ISO UTC para una fecha (YYYY-MM-DD) interpretada en la
 * zona horaria de la clínica.
 *
 * @param miembro Si presente, usa horarios del miembro (fallback a org) y
 *                filtra solapamientos por ese miembro. Si null/undefined,
 *                usa horarios org y considera solo turnos sin miembro.
 */
export function calcularSlotsLibres(
  org: Organizacion,
  fechaISO: string,
  duracionMin: number,
  turnos: Turno[],
  opts: { miembro?: Miembro | null; stepMin?: number; ocupadosExternos?: Ocupado[] } = {},
): string[] {
  const tz = org.zona_horaria || "America/Mexico_City";
  const stepMin = opts.stepMin ?? 30;

  // Anchor mediodía local para evitar DST edge
  const anchorLocal = `${fechaISO}T12:00:00`;
  const anchorUtc = fromZonedTime(anchorLocal, tz);
  const diaSemana = toZonedTime(anchorUtc, tz).getDay();

  const dia = (Object.keys(DIAS_INDEX) as Horario["dia"][]).find((k) => DIAS_INDEX[k] === diaSemana);
  if (!dia) return [];

  const horariosFuente = opts.miembro?.horarios?.length ? opts.miembro.horarios : org.horarios;
  const ventana = horariosFuente.find((h) => h.dia === dia);
  if (!ventana) return [];

  const inicio = fromZonedTime(`${fechaISO}T${ventana.desde}:00`, tz);
  const fin = fromZonedTime(`${fechaISO}T${ventana.hasta}:00`, tz);

  const turnosRelevantes = turnos.filter((t) => {
    if (t.estado === "cancelado") return false;
    if (opts.miembro) return t.miembro_id === opts.miembro.id;
    return !t.miembro_id;
  });

  const ocupados = turnosRelevantes.map((t) => {
    const start = new Date(t.fecha_turno).getTime();
    return { start, end: start + t.duracion_min * 60_000 };
  });

  // Sumar ocupados externos (Google Calendar)
  for (const ext of opts.ocupadosExternos ?? []) {
    ocupados.push({ start: new Date(ext.inicio).getTime(), end: new Date(ext.fin).getTime() });
  }

  const slots: string[] = [];
  const stepMs = stepMin * 60_000;
  const durMs = duracionMin * 60_000;

  for (let t = inicio.getTime(); t + durMs <= fin.getTime(); t += stepMs) {
    const slotEnd = t + durMs;
    const ocupado = ocupados.some((o) => t < o.end && o.start < slotEnd);
    if (!ocupado) slots.push(new Date(t).toISOString());
  }

  return slots;
}

export function formatearSlotLocal(iso: string, tz: string): string {
  return formatTz(toZonedTime(new Date(iso), tz), "HH:mm");
}
