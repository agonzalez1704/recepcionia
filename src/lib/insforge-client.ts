"use client";

import { useAuth } from "@clerk/nextjs";
import { createClient, type InsForgeClient } from "@insforge/sdk";
import { useEffect, useMemo, useState } from "react";
import { publicEnv } from "./env";

const TOKEN_REFRESH_MS = 50_000;

export function useInsforgeClient(): { client: InsForgeClient; isReady: boolean } {
  const { getToken, isSignedIn } = useAuth();
  const [isReady, setIsReady] = useState(false);

  const client = useMemo(
    () =>
      createClient({
        baseUrl: publicEnv.NEXT_PUBLIC_INSFORGE_BASE_URL,
        anonKey: publicEnv.NEXT_PUBLIC_INSFORGE_ANON_KEY,
      }),
    [],
  );

  useEffect(() => {
    if (!isSignedIn) {
      client.getHttpClient().setAuthToken(null);
      setIsReady(false);
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      try {
        const token = await getToken({ template: "insforge" });
        if (cancelled) return;
        client.getHttpClient().setAuthToken(token ?? null);
        setIsReady(!!token);
      } catch (err) {
        if (cancelled) return;
        client.getHttpClient().setAuthToken(null);
        setIsReady(false);
        console.error("No se pudo refrescar el token de Clerk para InsForge", err);
      }
    };

    void refresh();
    const id = setInterval(() => void refresh(), TOKEN_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [client, getToken, isSignedIn]);

  return { client, isReady };
}
