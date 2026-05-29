"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { apiFetch } from "@/components/shared/api";
import { PLANES, type PlanId } from "@/core/billing/planes";
import { cn } from "@/lib/utils";

type EstadoBilling = {
  estado: string;
  activo: boolean;
  plan: { id: string; nombre: string; topeConversaciones: number } | null;
  vigenteHasta: string | null;
  conversacionesUsadas: number;
};

const ETIQUETA_ESTADO: Record<string, string> = {
  active: "Activa",
  trialing: "En prueba",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
  none: "Sin suscripción",
};

export function FacturacionView({ esAdmin }: { esAdmin: boolean }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["billing-estado"],
    queryFn: () => apiFetch<EstadoBilling>("/api/billing/estado"),
    refetchInterval: 15_000,
  });

  // Toast al volver de Stripe checkout
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const r = params.get("checkout");
    if (r === "ok") {
      toast.success("¡Suscripción activada! Puede tardar unos segundos en reflejarse.");
      void qc.invalidateQueries({ queryKey: ["billing-estado"] });
    } else if (r === "cancel") {
      toast.info("Checkout cancelado.");
    }
    if (r) window.history.replaceState({}, "", window.location.pathname);
  }, [qc]);

  const checkout = useMutation({
    mutationFn: (planId: PlanId) =>
      apiFetch<{ url: string }>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ planId }),
      }),
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const portal = useMutation({
    mutationFn: () => apiFetch<{ url: string }>("/api/billing/portal", { method: "POST" }),
    onSuccess: ({ url }) => window.location.assign(url),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Cargando…
      </div>
    );
  }

  const planActivoId = data?.activo ? data.plan?.id : null;
  const usadas = data?.conversacionesUsadas ?? 0;
  const tope = data?.plan?.topeConversaciones ?? null;
  const pct = tope ? Math.min(Math.round((usadas / tope) * 100), 100) : 0;

  return (
    <div className="space-y-6">
      {/* Estado actual */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Plan actual</p>
            <p className="text-xl font-semibold">
              {data?.plan?.nombre ?? "Sin plan"}{" "}
              <span
                className={cn(
                  "ml-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  data?.activo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
                )}
              >
                {ETIQUETA_ESTADO[data?.estado ?? "none"] ?? data?.estado}
              </span>
            </p>
            {data?.vigenteHasta && (
              <p className="mt-1 text-xs text-slate-500">
                Vigente hasta {new Date(data.vigenteHasta).toLocaleDateString("es-AR")}
              </p>
            )}
          </div>
          {esAdmin && data?.activo && (
            <button
              onClick={() => portal.mutate()}
              disabled={portal.isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              {portal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Gestionar suscripción
            </button>
          )}
        </div>

        {/* Consumo */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Conversaciones este mes</span>
            <span className="font-medium">
              {usadas}
              {tope ? ` / ${tope}` : ""}
            </span>
          </div>
          {tope && (
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn("h-full transition-all", pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-brand-600")}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
          {!data?.activo && (
            <p className="mt-2 text-xs text-amber-700">
              El agente de WhatsApp no responde a pacientes hasta que actives una suscripción.
            </p>
          )}
        </div>
      </section>

      {/* Planes */}
      <section className="grid gap-4 md:grid-cols-3">
        {PLANES.map((plan) => {
          const esActual = planActivoId === plan.id;
          return (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-white p-5",
                plan.destacado ? "border-brand-600 ring-1 ring-brand-600" : "border-slate-200",
              )}
            >
              <h3 className="font-semibold">{plan.nombre}</h3>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-bold">${plan.precioUsd}</span>
                <span className="text-sm text-slate-500">USD/mes</span>
              </div>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-salud-500" /> {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={!esAdmin || esActual || checkout.isPending}
                onClick={() => checkout.mutate(plan.id)}
                className={cn(
                  "mt-5 rounded-xl px-4 py-2 text-sm font-medium",
                  esActual
                    ? "cursor-default bg-emerald-50 text-emerald-700"
                    : plan.destacado
                      ? "bg-brand-900 text-white hover:bg-brand-700 disabled:opacity-60"
                      : "border border-slate-300 text-slate-800 hover:bg-slate-50 disabled:opacity-60",
                )}
              >
                {esActual ? "Plan actual" : checkout.isPending ? "Redirigiendo…" : planActivoId ? "Cambiar a este plan" : "Suscribirme"}
              </button>
            </div>
          );
        })}
      </section>

      {!esAdmin && (
        <p className="text-sm text-slate-500">
          Solo los administradores de la clínica pueden cambiar la suscripción.
        </p>
      )}
    </div>
  );
}
