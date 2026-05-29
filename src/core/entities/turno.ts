import { z } from "zod";

export const EstadoTurnoSchema = z.enum(["pendiente", "confirmado", "cancelado", "completado"]);
export type EstadoTurno = z.infer<typeof EstadoTurnoSchema>;

export const TurnoSchema = z.object({
  id: z.string().uuid(),
  organizacion_id: z.string().uuid(),
  miembro_id: z.string().uuid().nullable().optional(),
  numero_telefono: z.string(),
  nombre_paciente: z.string(),
  fecha_turno: z.string(),
  duracion_min: z.number().int().positive(),
  servicio: z.string(),
  estado: EstadoTurnoSchema,
  notas: z.string().nullable().optional(),
  google_event_id: z.string().nullable().optional(),
  creado_en: z.string(),
  actualizado_en: z.string(),
});
export type Turno = z.infer<typeof TurnoSchema>;

export const CrearTurnoSchema = TurnoSchema.pick({
  numero_telefono: true,
  nombre_paciente: true,
  fecha_turno: true,
  duracion_min: true,
  servicio: true,
  notas: true,
  miembro_id: true,
}).extend({
  estado: EstadoTurnoSchema.default("confirmado"),
});
export type CrearTurno = z.infer<typeof CrearTurnoSchema>;

export const ActualizarTurnoSchema = z
  .object({
    fecha_turno: z.string().optional(),
    duracion_min: z.number().int().positive().optional(),
    estado: EstadoTurnoSchema.optional(),
    notas: z.string().nullable().optional(),
    nombre_paciente: z.string().optional(),
    servicio: z.string().optional(),
    miembro_id: z.string().uuid().nullable().optional(),
  })
  .strict();
export type ActualizarTurno = z.infer<typeof ActualizarTurnoSchema>;
