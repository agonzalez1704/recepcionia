import { z } from "zod";

const serverSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().optional().default(""),
  INSFORGE_API_KEY: z.string().min(1),
  INSFORGE_JWT_SECRET: z.string().min(1),
  INSFORGE_ENCRYPTION_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional().default(""),
  // Modelo de texto (triage, agenda) — barato. Vision usa el de abajo.
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_MODEL_VISION: z.string().default("gpt-4o"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_REDIRECT_URI: z.string().url().optional().default("http://localhost:3000/api/oauth/google/callback"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Twilio (cuenta parent ISV) — un solo par de credenciales para todos los tenants
  TWILIO_ACCOUNT_SID: z.string().optional().default(""),
  TWILIO_AUTH_TOKEN: z.string().optional().default(""),
  TWILIO_WABA_ID: z.string().optional().default(""),
  CRON_SECRET: z.string().optional().default(""),
  // Kapso (WhatsApp platform)
  KAPSO_API_KEY: z.string().optional().default(""),
  KAPSO_API_BASE_URL: z.string().optional().default("https://api.kapso.ai"),
  KAPSO_PROJECT_WEBHOOK_SECRET: z.string().optional().default(""),
  // Stripe / billing
  STRIPE_ENV: z.enum(["test", "live"]).default("test"),
  STRIPE_PRICE_ESENCIAL: z.string().optional().default(""),
  STRIPE_PRICE_PROFESIONAL: z.string().optional().default(""),
  STRIPE_PRICE_CLINICA: z.string().optional().default(""),
  // Bypass de gating de billing (solo pruebas)
  BILLING_DISABLED: z.string().optional().default(""),
});

const publicSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_INSFORGE_BASE_URL: z.string().url(),
  NEXT_PUBLIC_INSFORGE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
});

const publicEnvRaw = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_INSFORGE_BASE_URL: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL,
  NEXT_PUBLIC_INSFORGE_ANON_KEY: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
};

export const publicEnv = publicSchema.parse(publicEnvRaw);

let cachedServer: z.infer<typeof serverSchema> | null = null;

export function getServerEnv() {
  if (cachedServer) return cachedServer;
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() solo puede ejecutarse en el server");
  }
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Variables de entorno inválidas:", parsed.error.flatten().fieldErrors);
    throw new Error("Variables de entorno faltantes o inválidas");
  }
  cachedServer = parsed.data;
  return cachedServer;
}
