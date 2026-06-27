"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Headset, RotateCcw } from "lucide-react";
import { apiFetch } from "@/components/shared/api";

type ConversacionHandoff = {
  id: string;
  numero_telefono: string;
  motivo: string | null;
  derivado_en: string | null;
};

export function HandoffBanner() {
  const qc = useQueryClient();
  const { data: enHandoff = [] } = useQuery({
    queryKey: ["conversaciones-handoff"],
    queryFn: () => apiFetch<ConversacionHandoff[]>("/api/conversaciones"),
    refetchInterval: 5000,
  });

  const reactivar = useMutation({
    mutationFn: (numero: string) =>
      apiFetch("/api/conversaciones", {
        method: "PATCH",
        body: JSON.stringify({ numero, estado: "bot" }),
      }),
    onSuccess: () => {
      toast.success("Bot reactivado para esa conversación");
      void qc.invalidateQueries({ queryKey: ["conversaciones-handoff"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  if (enHandoff.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
        <Headset className="h-4 w-4" />
        {enHandoff.length} conversación{enHandoff.length > 1 ? "es" : ""} en manos del equipo · bot en pausa
      </div>
      <ul className="space-y-2">
        {enHandoff.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-slate-800">{c.numero_telefono}</p>
              {c.motivo && <p className="truncate text-xs text-slate-500">{c.motivo}</p>}
            </div>
            <button
              onClick={() => reactivar.mutate(c.numero_telefono)}
              disabled={reactivar.isPending}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-600 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Devolver al bot
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
