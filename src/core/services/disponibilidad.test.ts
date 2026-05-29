import { describe, it, expect } from "vitest";
import { calcularSlotsLibres } from "./disponibilidad";
import type { Organizacion } from "@/core/entities/organizacion";
import type { Turno } from "@/core/entities/turno";
import type { Miembro } from "@/core/entities/miembro";

const ORG: Organizacion = {
  id: "org",
  clerk_org_id: "org_x",
  nombre_clinica: "Test",
  slug: "test",
  zona_horaria: "America/Mexico_City", // UTC-6 sin DST
  horarios: [
    { dia: "vie", desde: "09:00", hasta: "12:00" }, // 3 horas
  ],
  servicios: [],
  ics_token: "tok",
  creado_en: "2026-01-01T00:00:00Z",
  actualizado_en: "2026-01-01T00:00:00Z",
};

describe("calcularSlotsLibres", () => {
  it("devuelve [] si el día no tiene ventana", () => {
    const slots = calcularSlotsLibres(ORG, "2026-05-30", 30, []); // sábado
    expect(slots).toEqual([]);
  });

  it("genera slots de 30 min en ventana 09:00-12:00 (México)", () => {
    // 2026-05-29 es viernes
    const slots = calcularSlotsLibres(ORG, "2026-05-29", 30, []);
    // 9:00, 9:30, 10:00, 10:30, 11:00, 11:30 → 6 slots
    expect(slots.length).toBe(6);
    // 9:00 México = 15:00 UTC
    expect(slots[0]).toBe("2026-05-29T15:00:00.000Z");
    expect(slots[5]).toBe("2026-05-29T17:30:00.000Z");
  });

  it("excluye slots ocupados por turnos", () => {
    const ocupado: Turno = {
      id: "t1",
      organizacion_id: ORG.id,
      miembro_id: null,
      numero_telefono: "+52",
      nombre_paciente: "X",
      fecha_turno: "2026-05-29T15:00:00.000Z", // 9:00 local
      duracion_min: 60, // ocupa 9:00-10:00
      servicio: "C",
      estado: "confirmado",
      notas: null,
      google_event_id: null,
      creado_en: "2026-05-29T00:00:00Z",
      actualizado_en: "2026-05-29T00:00:00Z",
    };
    const slots = calcularSlotsLibres(ORG, "2026-05-29", 30, [ocupado]);
    // Sin 9:00 ni 9:30 → arranca 10:00
    expect(slots).not.toContain("2026-05-29T15:00:00.000Z");
    expect(slots).not.toContain("2026-05-29T15:30:00.000Z");
    expect(slots[0]).toBe("2026-05-29T16:00:00.000Z");
  });

  it("ignora turnos cancelados", () => {
    const cancelado: Turno = {
      id: "t2",
      organizacion_id: ORG.id,
      miembro_id: null,
      numero_telefono: "+52",
      nombre_paciente: "X",
      fecha_turno: "2026-05-29T15:00:00.000Z",
      duracion_min: 60,
      servicio: "C",
      estado: "cancelado",
      notas: null,
      google_event_id: null,
      creado_en: "2026-05-29T00:00:00Z",
      actualizado_en: "2026-05-29T00:00:00Z",
    };
    const slots = calcularSlotsLibres(ORG, "2026-05-29", 30, [cancelado]);
    expect(slots).toContain("2026-05-29T15:00:00.000Z");
  });

  it("excluye slots ocupados por eventos externos (Google)", () => {
    const slots = calcularSlotsLibres(ORG, "2026-05-29", 30, [], {
      ocupadosExternos: [
        { inicio: "2026-05-29T15:00:00.000Z", fin: "2026-05-29T16:00:00.000Z" }, // 9-10 local
      ],
    });
    expect(slots).not.toContain("2026-05-29T15:00:00.000Z");
    expect(slots).not.toContain("2026-05-29T15:30:00.000Z");
    expect(slots[0]).toBe("2026-05-29T16:00:00.000Z");
  });

  it("usa horarios propios del miembro si tiene", () => {
    const miembro: Miembro = {
      id: "m1",
      organizacion_id: ORG.id,
      nombre: "Dr. X",
      rol: null,
      servicios: [],
      horarios: [{ dia: "vie", desde: "14:00", hasta: "16:00" }], // 2h
      color: "#000",
      activo: true,
      creado_en: "2026-01-01T00:00:00Z",
      actualizado_en: "2026-01-01T00:00:00Z",
    };
    const slots = calcularSlotsLibres(ORG, "2026-05-29", 30, [], { miembro });
    // 14:00, 14:30, 15:00, 15:30 → 4 slots
    expect(slots.length).toBe(4);
    expect(slots[0]).toBe("2026-05-29T20:00:00.000Z"); // 14:00 México = 20:00 UTC
  });
});
