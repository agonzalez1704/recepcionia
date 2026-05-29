import { z } from "zod";
import { HorarioSchema } from "./organizacion";

export const MiembroSchema = z.object({
  id: z.string().uuid(),
  organizacion_id: z.string().uuid(),
  nombre: z.string().min(1),
  rol: z.string().nullable().optional(),
  especialidad: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  servicios: z.array(z.string()).default([]),
  horarios: z.array(HorarioSchema).default([]),
  color: z.string().default("#0EA5E9"),
  activo: z.boolean(),
  creado_en: z.string(),
  actualizado_en: z.string(),
});
export type Miembro = z.infer<typeof MiembroSchema>;

export const CrearMiembroSchema = z.object({
  nombre: z.string().min(1),
  rol: z.string().optional().nullable(),
  especialidad: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  servicios: z.array(z.string()).optional().default([]),
  horarios: z.array(HorarioSchema).optional().default([]),
  color: z.string().optional().default("#0EA5E9"),
});
export type CrearMiembro = z.infer<typeof CrearMiembroSchema>;

export const ActualizarMiembroSchema = CrearMiembroSchema.partial().extend({
  activo: z.boolean().optional(),
});
export type ActualizarMiembro = z.infer<typeof ActualizarMiembroSchema>;
