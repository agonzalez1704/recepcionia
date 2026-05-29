import { z } from "zod";

export const HorarioSchema = z.object({
  dia: z.enum(["lun", "mar", "mie", "jue", "vie", "sab", "dom"]),
  desde: z.string().regex(/^\d{2}:\d{2}$/),
  hasta: z.string().regex(/^\d{2}:\d{2}$/),
});
export type Horario = z.infer<typeof HorarioSchema>;

export const ServicioSchema = z.object({
  nombre: z.string().min(1),
  duracion_min: z.number().int().positive(),
  descripcion: z.string().optional().default(""),
});
export type Servicio = z.infer<typeof ServicioSchema>;

export const OrganizacionSchema = z.object({
  id: z.string().uuid(),
  clerk_org_id: z.string(),
  nombre_clinica: z.string(),
  slug: z.string(),
  direccion: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  horarios: z.array(HorarioSchema).default([]),
  servicios: z.array(ServicioSchema).default([]),
  sobre_clinica: z.string().nullable().optional(),
  zona_horaria: z.string().default("America/Mexico_City"),
  ics_token: z.string(),
  creado_en: z.string(),
  actualizado_en: z.string(),
});
export type Organizacion = z.infer<typeof OrganizacionSchema>;

export const ActualizarOrganizacionSchema = OrganizacionSchema.pick({
  nombre_clinica: true,
  direccion: true,
  telefono: true,
  email: true,
  horarios: true,
  servicios: true,
  sobre_clinica: true,
  zona_horaria: true,
}).partial();
export type ActualizarOrganizacion = z.infer<typeof ActualizarOrganizacionSchema>;
