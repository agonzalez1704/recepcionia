"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import { apiFetch } from "@/components/shared/api";
import { Section } from "./section";

type EstadoWA = {
  numero_whatsapp: string | null;
  estado_sender: string;
  connection_type: string | null;
  conectado: boolean;
} | null;

export function Whatsapp({ readOnly }: { readOnly: boolean }) {
  const qc = useQueryClient();
  const { data: estado, isLoading } = useQuery({
    queryKey: ["whatsapp-estado"],
    queryFn: () => apiFetch<EstadoWA>("/api/integraciones/whatsapp"),
    refetchInterval: (q) => {
      const e = (q.state.data as EstadoWA)?.estado_sender;
      return e === "creando" || e === "en_revision" ? 8000 : false;
    },
  });

  // Toast al volver del setup link de Kapso
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const wa = params.get("wa");
    if (wa === "ok") {
      toast.success("WhatsApp conectado 🎉 Puede tardar unos segundos en activarse.");
      void qc.invalidateQueries({ queryKey: ["whatsapp-estado"] });
    } else if (wa === "error") {
      toast.error("No se pudo conectar WhatsApp. Probá de nuevo o pedinos ayuda.");
    }
    if (wa) window.history.replaceState({}, "", window.location.pathname);
  }, [qc]);

  const conectar = useMutation({
    mutationFn: () => apiFetch<{ url: string }>("/api/integraciones/whatsapp/conectar", { method: "POST", body: "{}" }),
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const desconectar = useMutation({
    mutationFn: () => apiFetch("/api/integraciones/whatsapp", { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Desconectado");
      void qc.invalidateQueries({ queryKey: ["whatsapp-estado"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const conectado = !!estado?.conectado;
  const enProceso = !!estado && !conectado && estado.estado_sender !== "sin_configurar";

  return (
    <Section titulo="WhatsApp" icon={MessageSquare} conectado={conectado}>
      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : conectado ? (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div>
            <p className="font-medium">{estado?.numero_whatsapp ?? "Número conectado"}</p>
            <p className="text-xs text-slate-500">
              Conectado{estado?.connection_type ? ` · ${estado.connection_type === "coexistence" ? "coexistencia (mantenés la app)" : "dedicado"}` : ""}
            </p>
          </div>
          {!readOnly && (
            <button
              onClick={() => { if (confirm("¿Desconectar WhatsApp? El agente dejará de responder.")) desconectar.mutate(); }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
            >
              Desconectar
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Conectá el WhatsApp de tu clínica. Tus pacientes ven el nombre y logo de tu clínica. Podés usar tu número actual
            (manteniendo la app de WhatsApp Business) o uno dedicado.
          </p>

          {enProceso && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Conexión en proceso. Si abriste el asistente de Meta y lo cerraste sin terminar, volvé a intentar.
            </div>
          )}

          {!readOnly && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => conectar.mutate()}
                disabled={conectar.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {conectar.isPending ? "Generando enlace…" : "Conectar WhatsApp"}
              </button>
              <a
                href="mailto:soporte@recepcionia.app?subject=Ayuda%20para%20conectar%20mi%20WhatsApp"
                className="text-sm font-medium text-brand-700 hover:underline"
              >
                ¿Necesitás ayuda? Te lo conectamos nosotros
              </a>
            </div>
          )}

          <details className="text-sm text-slate-600">
            <summary className="cursor-pointer font-medium">¿Cómo es el proceso?</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Tocás &quot;Conectar WhatsApp&quot; → te lleva al asistente seguro de Meta.</li>
              <li>Iniciás sesión con Facebook y elegís tu número (existente o nuevo).</li>
              <li>Verificás el número (~5 min) y volvés acá. Listo.</li>
            </ol>
            <p className="mt-2 text-xs text-slate-500">
              Es un paso único que pide Meta para cualquier WhatsApp Business. Si te traba, escribinos y lo hacemos juntos.
            </p>
          </details>
        </div>
      )}
    </Section>
  );
}
