import type { Turno } from "@/core/entities/turno";
import type { Organizacion } from "@/core/entities/organizacion";
import type { Miembro } from "@/core/entities/miembro";

const CRLF = "\r\n";

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** YYYYMMDDTHHMMSSZ — formato UTC para DTSTART/DTEND */
function formatUtc(iso: string): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${day}T${h}${min}${s}Z`;
}

/** Fold lines >75 octets como pide RFC 5545 */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    const chunk = line.slice(i, i + (i === 0 ? 75 : 74));
    out.push((i === 0 ? "" : " ") + chunk);
    i += i === 0 ? 75 : 74;
  }
  return out.join(CRLF);
}

export type GenerarFeedInput = {
  organizacion: Organizacion;
  turnos: Turno[];
  miembros: Miembro[];
};

export function generarFeedICS({ organizacion, turnos, miembros }: GenerarFeedInput): string {
  const miembroById = new Map(miembros.map((m) => [m.id, m]));
  const ahora = formatUtc(new Date().toISOString());
  const prodid = `-//${escapeText(organizacion.nombre_clinica)}//Recepcion IA//ES`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${prodid}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${escapeText(organizacion.nombre_clinica)}`),
    fold(`X-WR-TIMEZONE:${escapeText(organizacion.zona_horaria)}`),
  ];

  for (const t of turnos) {
    if (t.estado === "cancelado") continue;
    const inicio = formatUtc(t.fecha_turno);
    const fin = formatUtc(new Date(new Date(t.fecha_turno).getTime() + t.duracion_min * 60_000).toISOString());
    const miembro = t.miembro_id ? miembroById.get(t.miembro_id) : null;
    const summary = `${t.servicio} — ${t.nombre_paciente}${miembro ? ` (${miembro.nombre})` : ""}`;
    const descripcion = [
      `Paciente: ${t.nombre_paciente}`,
      `Teléfono: ${t.numero_telefono}`,
      miembro ? `Profesional: ${miembro.nombre}` : null,
      `Estado: ${t.estado}`,
      t.notas ? `Notas: ${t.notas}` : null,
    ]
      .filter(Boolean)
      .join("\\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:turno-${t.id}@${organizacion.slug}`,
      `DTSTAMP:${ahora}`,
      `DTSTART:${inicio}`,
      `DTEND:${fin}`,
      fold(`SUMMARY:${escapeText(summary)}`),
      fold(`DESCRIPTION:${descripcion}`),
      `STATUS:${t.estado === "confirmado" ? "CONFIRMED" : "TENTATIVE"}`,
      `LAST-MODIFIED:${formatUtc(t.actualizado_en)}`,
      `CREATED:${formatUtc(t.creado_en)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join(CRLF) + CRLF;
}
