import { z } from "zod";

export const IntegracionWhatsAppSchema = z.object({
  id: z.string().uuid(),
  organizacion_id: z.string().uuid(),
  proveedor: z.string().default("twilio"),
  numero_whatsapp: z.string(),
  twilio_account_sid: z.string(),
  twilio_auth_token: z.string(),
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
  activo: z.boolean(),
});
export type IntegracionGoogle = z.infer<typeof IntegracionGoogleSchema>;
