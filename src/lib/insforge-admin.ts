import { createClient, type InsForgeClient } from "@insforge/sdk";
import { publicEnv, getServerEnv } from "./env";

let cached: InsForgeClient | null = null;

/**
 * Server-only admin client using the InsForge API key. Bypasses RLS — use ONLY
 * in trusted server contexts (webhooks, cron, route handlers after explicit
 * tenant authorization). Never expose to client code.
 */
export function getInsforgeAdmin(): InsForgeClient {
  if (cached) return cached;
  if (typeof window !== "undefined") {
    throw new Error("getInsforgeAdmin() es solo server-side");
  }
  const env = getServerEnv();
  cached = createClient({
    baseUrl: publicEnv.NEXT_PUBLIC_INSFORGE_BASE_URL,
    anonKey: publicEnv.NEXT_PUBLIC_INSFORGE_ANON_KEY,
  });
  cached.getHttpClient().setAuthToken(env.INSFORGE_API_KEY);
  return cached;
}
