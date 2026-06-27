"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/components/shared/api";
import type { IntegracionesData } from "./components/tipos";
import { Whatsapp } from "./components/whatsapp";
import { Google } from "./components/google";
import { Ics } from "./components/ics";

export function IntegracionesView({ readOnly }: { readOnly: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["integraciones"],
    queryFn: () => apiFetch<IntegracionesData>("/api/integraciones"),
  });

  // Mostrar toast si volvimos del flujo OAuth con resultado
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ok = params.get("google_ok");
    const err = params.get("google_error");
    if (ok) {
      toast.success(`Conectado como ${ok}`);
      void qc.invalidateQueries({ queryKey: ["integraciones"] });
    } else if (err) {
      toast.error(`Google falló: ${err}`);
    }
    if (ok || err) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [qc]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Whatsapp readOnly={readOnly} />
      <Google
        readOnly={readOnly}
        google={data?.google ?? []}
        miembros={data?.miembros ?? []}
        onCambio={() => qc.invalidateQueries({ queryKey: ["integraciones"] })}
      />
      <Ics
        url={data?.ics.url ?? ""}
        readOnly={readOnly}
        onRegen={() => qc.invalidateQueries({ queryKey: ["integraciones"] })}
      />
    </div>
  );
}
