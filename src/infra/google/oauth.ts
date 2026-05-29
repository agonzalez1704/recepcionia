import { OAuth2Client } from "google-auth-library";
import { getServerEnv } from "@/lib/env";
import { createHmac, randomBytes } from "node:crypto";

export const SCOPES_GOOGLE = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function crearClienteOAuth() {
  const env = getServerEnv();
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth no configurado (GOOGLE_CLIENT_ID/SECRET faltantes)");
  }
  return new OAuth2Client({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI,
  });
}

// ---------- State firmado ----------

export type EstadoOAuth = {
  orgId: string; // Clerk org id
  userId: string;
  miembroId: string | null;
  nonce: string;
  ts: number;
};

function secretoFirma(): string {
  return getServerEnv().INSFORGE_ENCRYPTION_KEY; // reusamos
}

export function firmarEstado(payload: Omit<EstadoOAuth, "nonce" | "ts">): string {
  const full: EstadoOAuth = { ...payload, nonce: randomBytes(8).toString("hex"), ts: Date.now() };
  const json = JSON.stringify(full);
  const b64 = Buffer.from(json).toString("base64url");
  const sig = createHmac("sha256", secretoFirma()).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

export function verificarEstado(state: string, maxAgeMs = 10 * 60_000): EstadoOAuth {
  const [b64, sig] = state.split(".");
  if (!b64 || !sig) throw new Error("state malformado");
  const esperado = createHmac("sha256", secretoFirma()).update(b64).digest("base64url");
  if (sig !== esperado) throw new Error("state firma invalida");
  const parsed: EstadoOAuth = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
  if (Date.now() - parsed.ts > maxAgeMs) throw new Error("state expirado");
  return parsed;
}
