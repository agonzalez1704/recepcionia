import { describe, it, expect } from "vitest";
import { generarFeedICS } from "./feed";
import type { Organizacion } from "@/core/entities/organizacion";
import type { Turno } from "@/core/entities/turno";
import type { Miembro } from "@/core/entities/miembro";

const ORG: Organizacion = {
  id: "00000000-0000-0000-0000-000000000001",
  clerk_org_id: "org_x",
  nombre_clinica: "Clínica de Prueba",
  slug: "clinica-prueba",
  zona_horaria: "America/Mexico_City",
  horarios: [],
  servicios: [],
  ics_token: "tok",
  creado_en: "2026-01-01T00:00:00Z",
  actualizado_en: "2026-01-01T00:00:00Z",
};

const MIEMBRO: Miembro = {
  id: "00000000-0000-0000-0000-000000000002",
  organizacion_id: ORG.id,
  nombre: "Dra. López",
  rol: "Odontóloga",
  servicios: [],
  horarios: [],
  color: "#0EA5E9",
  activo: true,
  creado_en: "2026-01-01T00:00:00Z",
  actualizado_en: "2026-01-01T00:00:00Z",
};

function turno(over: Partial<Turno> = {}): Turno {
  return {
    id: "00000000-0000-0000-0000-000000000010",
    organizacion_id: ORG.id,
    miembro_id: null,
    numero_telefono: "+52123456",
    nombre_paciente: "Juan Pérez",
    fecha_turno: "2026-05-29T20:00:00.000Z",
    duracion_min: 30,
    servicio: "Consulta",
    estado: "confirmado",
    notas: null,
    google_event_id: null,
    creado_en: "2026-05-28T10:00:00Z",
    actualizado_en: "2026-05-28T10:00:00Z",
    ...over,
  };
}

describe("generarFeedICS", () => {
  it("incluye headers VCALENDAR válidos", () => {
    const out = generarFeedICS({ organizacion: ORG, turnos: [], miembros: [] });
    expect(out).toContain("BEGIN:VCALENDAR");
    expect(out).toContain("END:VCALENDAR");
    expect(out).toContain("VERSION:2.0");
    expect(out).toContain("PRODID:");
  });

  it("usa CRLF como line ending", () => {
    const out = generarFeedICS({ organizacion: ORG, turnos: [turno()], miembros: [] });
    expect(out).toContain("\r\n");
    expect(out.split("\r\n").length).toBeGreaterThan(5);
  });

  it("genera VEVENT con DTSTART/DTEND/UID/SUMMARY", () => {
    const out = generarFeedICS({ organizacion: ORG, turnos: [turno()], miembros: [] });
    expect(out).toContain("BEGIN:VEVENT");
    expect(out).toContain("UID:turno-00000000-0000-0000-0000-000000000010@clinica-prueba");
    expect(out).toContain("DTSTART:20260529T200000Z");
    expect(out).toContain("DTEND:20260529T203000Z");
    expect(out).toContain("SUMMARY:Consulta — Juan Pérez");
    expect(out).toContain("STATUS:CONFIRMED");
    expect(out).toContain("END:VEVENT");
  });

  it("omite turnos cancelados", () => {
    const out = generarFeedICS({
      organizacion: ORG,
      turnos: [turno({ id: "00000000-0000-0000-0000-000000000099", estado: "cancelado" })],
      miembros: [],
    });
    expect(out).not.toContain("BEGIN:VEVENT");
  });

  it("incluye nombre del miembro en SUMMARY cuando aplica", () => {
    const out = generarFeedICS({
      organizacion: ORG,
      turnos: [turno({ miembro_id: MIEMBRO.id })],
      miembros: [MIEMBRO],
    });
    expect(out).toContain("Dra. López");
  });

  it("escapa caracteres especiales (comas, punto y coma, backslash)", () => {
    const out = generarFeedICS({
      organizacion: ORG,
      turnos: [turno({ nombre_paciente: "Pérez, Juan; el \\Grande" })],
      miembros: [],
    });
    expect(out).toContain("Pérez\\, Juan\\; el \\\\Grande");
  });

  it("marca STATUS:TENTATIVE para turnos pendientes", () => {
    const out = generarFeedICS({
      organizacion: ORG,
      turnos: [turno({ estado: "pendiente" })],
      miembros: [],
    });
    expect(out).toContain("STATUS:TENTATIVE");
  });
});
