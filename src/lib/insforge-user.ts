import { auth } from "@clerk/nextjs/server";
import { createClient, type InsForgeClient } from "@insforge/sdk";
import { publicEnv } from "./env";

/**
 * Crea un cliente InsForge autenticado con el JWT de Clerk del usuario actual
 * (rol "authenticated"). Necesario para operaciones que exigen user token y no
 * aceptan el API key admin (ej. payments.createCheckoutSession).
 * Server-side only.
 */
export async function getInsforgeUserClient(): Promise<InsForgeClient> {
  const { getToken } = await auth();
  const token = await getToken({ template: "insforge" });
  if (!token) throw new Error("No se pudo obtener el token de usuario de Clerk");
  const client = createClient({
    baseUrl: publicEnv.NEXT_PUBLIC_INSFORGE_BASE_URL,
    anonKey: publicEnv.NEXT_PUBLIC_INSFORGE_ANON_KEY,
  });
  client.getHttpClient().setAuthToken(token);
  return client;
}
