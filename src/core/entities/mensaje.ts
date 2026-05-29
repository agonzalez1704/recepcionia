import { z } from "zod";

export const RemitenteSchema = z.enum(["paciente", "asistente"]);
export type Remitente = z.infer<typeof RemitenteSchema>;

export const MensajeSchema = z.object({
  id: z.string().uuid(),
  organizacion_id: z.string().uuid(),
  numero_telefono: z.string(),
  contenido: z.string(),
  remitente: RemitenteSchema,
  tipo: z.string().default("texto"),
  metadatos: z.record(z.string(), z.unknown()).nullable().optional(),
  recibido_en: z.string(),
});
export type Mensaje = z.infer<typeof MensajeSchema>;
