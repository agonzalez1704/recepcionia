import { z } from "zod";

export const EstadoSenderSchema = z.enum([
  "sin_configurar",
  "creando",
  "pendiente_otp",
  "en_revision",
  "online",
  "offline",
]);
export type EstadoSender = z.infer<typeof EstadoSenderSchema>;

export const IntegracionWhatsAppSchema = z.object({
  id: z.string().uuid(),
  organizacion_id: z.string().uuid(),
  proveedor: z.string().default("kapso"),
  numero_whatsapp: z.string().nullable().optional(),
  // Columnas legacy (modelo viejo) — se mantienen nullable por compat de datos.
  sender_sid: z.string().nullable().optional(),
  telefono_sid: z.string().nullable().optional(),
  pais: z.string().nullable().optional(),
  estado_sender: EstadoSenderSchema.default("sin_configurar"),
  // Modelo Kapso
  kapso_customer_id: z.string().nullable().optional(),
  phone_number_id: z.string().nullable().optional(),
  business_account_id: z.string().nullable().optional(),
  display_phone_number: z.string().nullable().optional(),
  connection_type: z.string().nullable().optional(),
  webhook_secret: z.string().nullable().optional(),
  activo: z.boolean(),
});
export type IntegracionWhatsApp = z.infer<typeof IntegracionWhatsAppSchema>;

export const IntegracionGoogleSchema = z.object({
  id: z.string().uuid(),
  organizacion_id: z.string().uuid(),
  miembro_id: z.string().uuid().nullable().optional(),
  usuario_clerk_id: z.string(),
  email_google: z.string().email(),
  access_token: z.string(),
  refresh_token: z.string(),
  calendario_id: z.string(),
  expira_en: z.string(),
  canal_id: z.string().nullable().optional(),
  resource_id: z.string().nullable().optional(),
  sync_token: z.string().nullable().optional(),
  canal_expira_en: z.string().nullable().optional(),
  activo: z.boolean(),
});
export type IntegracionGoogle = z.infer<typeof IntegracionGoogleSchema>;
