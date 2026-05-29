"use client";

import type { ApiOk, ApiErr } from "@/lib/api";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json()) as ApiOk<T> | ApiErr;
  if (!json.ok) throw new Error(json.error?.mensaje ?? "Error inesperado");
  return json.data;
}
