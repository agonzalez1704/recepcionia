import type { InsForgeClient } from "@insforge/sdk";
import { PLANES, planPorPriceId, type Plan } from "@/core/billing/planes";
import { getServerEnv } from "@/lib/env";

export type EstadoBilling = {
  activo: boolean; // hay suscripción que habilita el servicio
  estado: string; // active | trialing | past_due | canceled | none
  plan: Plan | null;
  vigenteHasta: string | null;
  stripeSubscriptionId: string | null;
};

const ESTADOS_ACTIVOS = new Set(["active", "trialing", "past_due"]);

type EstadoRow = {
  stripe_subscription_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  stripe_price_id: string | null;
};

/**
 * Lee el estado de billing de una organización desde las tablas payments.*
 * (proyección de Stripe que mantiene InsForge). Server-side: usa admin client.
 * `entornoStripe` = "test" | "live".
 */
export async function obtenerEstadoBilling(
  admin: InsForgeClient,
  orgId: string,
  entornoStripe: "test" | "live" = "test",
): Promise<EstadoBilling> {
  const vacio: EstadoBilling = {
    activo: false,
    estado: "none",
    plan: null,
    vigenteHasta: null,
    stripeSubscriptionId: null,
  };

  const { data, error } = await admin.database.rpc("billing_estado_org", {
    p_org_id: orgId,
    p_env: entornoStripe,
  });

  if (error) {
    console.error("No se pudo leer estado de billing:", error);
    return vacio;
  }

  const rows = (data as EstadoRow[] | null) ?? [];
  if (rows.length === 0) return vacio;

  // La RPC ordena por prioridad de estado; la primera fila es la suscripción relevante.
  const sub = rows[0];

  // Mapear price → plan (puede haber varias filas por items del mismo sub)
  const env = getServerEnv() as unknown as Record<string, string | undefined>;
  let plan: Plan | null = null;
  for (const r of rows) {
    if (r.stripe_subscription_id !== sub.stripe_subscription_id) continue;
    if (r.stripe_price_id) {
      const p = planPorPriceId(r.stripe_price_id, env);
      if (p) {
        plan = p;
        break;
      }
    }
  }

  return {
    activo: ESTADOS_ACTIVOS.has(sub.status),
    estado: sub.status,
    plan,
    vigenteHasta: sub.current_period_end,
    stripeSubscriptionId: sub.stripe_subscription_id,
  };
}

/** Inicio del mes calendario actual en ISO (para contar conversaciones). */
export function inicioMesActualIso(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export type ChequeoAgente = {
  permitido: boolean;
  motivo?: "sin_suscripcion" | "tope_alcanzado";
  plan: Plan | null;
  usadas: number;
  tope: number | null;
};

/**
 * Decide si el agente puede responder: requiere suscripción activa y estar bajo
 * el tope mensual de conversaciones del plan.
 */
export async function chequearAgente(
  admin: InsForgeClient,
  orgId: string,
  conversacionesUsadas: number,
  entornoStripe: "test" | "live" = "test",
): Promise<ChequeoAgente> {
  // Bypass de gating para pruebas (env BILLING_DISABLED=true). No fabrica
  // suscripción: simplemente habilita el agente sin chequear billing.
  if (getServerEnv().BILLING_DISABLED === "true") {
    return { permitido: true, plan: null, usadas: conversacionesUsadas, tope: null };
  }
  const billing = await obtenerEstadoBilling(admin, orgId, entornoStripe);
  if (!billing.activo || !billing.plan) {
    return { permitido: false, motivo: "sin_suscripcion", plan: billing.plan, usadas: conversacionesUsadas, tope: billing.plan?.topeConversaciones ?? null };
  }
  const tope = billing.plan.topeConversaciones;
  if (conversacionesUsadas >= tope) {
    return { permitido: false, motivo: "tope_alcanzado", plan: billing.plan, usadas: conversacionesUsadas, tope };
  }
  return { permitido: true, plan: billing.plan, usadas: conversacionesUsadas, tope };
}

export { PLANES };
