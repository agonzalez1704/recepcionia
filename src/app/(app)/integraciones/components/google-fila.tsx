"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plug2, X } from "lucide-react";
import { apiFetch } from "@/components/shared/api";
import type { IntegracionGoogleItem } from "./tipos";

export function GoogleFila({
  titulo,
  subtitulo,
  colorChip,
  actual,
  startHref,
  readOnly,
  onCambio,
  compacto,
}: {
  titulo: string;
  subtitulo?: string;
  colorChip?: string;
  actual: IntegracionGoogleItem | null;
  startHref: string;
  readOnly: boolean;
  onCambio: () => void;
  compacto?: boolean;
}) {
  const desconectar = useMutation({
    mutationFn: () => apiFetch(`/api/integraciones/google/${actual!.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Desconectado");
      onCambio();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white ${
        compacto ? "p-3" : "p-4"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {colorChip && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorChip }} />}
          <p className="font-medium">{titulo}</p>
          {actual?.activo && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Conectado
            </span>
          )}
        </div>
        {subtitulo && <p className="text-xs text-slate-500">{subtitulo}</p>}
        {actual && (
          <p className="mt-0.5 truncate text-xs text-slate-600">
            <span className="text-slate-400">como</span> {actual.email_google}
          </p>
        )}
      </div>
      {!readOnly && (
        <div className="flex shrink-0 items-center gap-2">
          {actual ? (
            <button
              onClick={() => {
                if (confirm("¿Desconectar esta cuenta de Google?")) desconectar.mutate();
              }}
              disabled={desconectar.isPending}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              title="Desconectar"
            >
              <X className="h-3.5 w-3.5" /> Desconectar
            </button>
          ) : (
            <a
              href={startHref}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              <Plug2 className="h-3.5 w-3.5" /> Conectar
            </a>
          )}
        </div>
      )}
    </div>
  );
}
