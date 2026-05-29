/**
 * Catálogo de planes — única fuente de verdad.
 * Los Stripe price IDs se cargan desde env (se crean con `payments` CLI).
 * topeConversaciones = límite mensual de conversaciones (mensajes entrantes de
 * pacientes que disparan al agente) antes de cortar el agente.
 */

export type PlanId = "esencial" | "profesional" | "clinica";

export type Plan = {
  id: PlanId;
  nombre: string;
  precioUsd: number;
  topeConversaciones: number;
  topeMiembros: number | null; // null = ilimitado
  descripcion: string;
  destacado?: boolean;
  features: string[];
  stripePriceIdEnv: string; // nombre de la env var con el price id
};

export const PLANES: Plan[] = [
  {
    id: "esencial",
    nombre: "Esencial",
    precioUsd: 39,
    topeConversaciones: 500,
    topeMiembros: 2,
    descripcion: "Para consultorios chicos que arrancan.",
    features: [
      "Hasta 2 profesionales",
      "500 conversaciones / mes",
      "Agente IA por WhatsApp 24/7",
      "Google Calendar + feed iOS",
      "Dashboard de mensajes y turnos",
    ],
    stripePriceIdEnv: "STRIPE_PRICE_ESENCIAL",
  },
  {
    id: "profesional",
    nombre: "Profesional",
    precioUsd: 89,
    topeConversaciones: 1500,
    topeMiembros: 6,
    descripcion: "Para clínicas con varios profesionales.",
    destacado: true,
    features: [
      "Hasta 6 profesionales",
      "1.500 conversaciones / mes",
      "Triage por especialista",
      "Notas de voz e imágenes",
      "Calendario por miembro",
      "Todo lo de Esencial",
    ],
    stripePriceIdEnv: "STRIPE_PRICE_PROFESIONAL",
  },
  {
    id: "clinica",
    nombre: "Clínica",
    precioUsd: 189,
    topeConversaciones: 5000,
    topeMiembros: null,
    descripcion: "Para clínicas grandes y multi-sede.",
    features: [
      "Profesionales ilimitados",
      "5.000 conversaciones / mes",
      "Soporte prioritario",
      "Todo lo de Profesional",
    ],
    stripePriceIdEnv: "STRIPE_PRICE_CLINICA",
  },
];

export function getPlan(id: PlanId): Plan {
  const p = PLANES.find((x) => x.id === id);
  if (!p) throw new Error(`Plan desconocido: ${id}`);
  return p;
}

/** Resuelve el plan a partir de un Stripe price id (para mapear suscripciones). */
export function planPorPriceId(priceId: string, env: Record<string, string | undefined>): Plan | null {
  return PLANES.find((p) => env[p.stripePriceIdEnv] === priceId) ?? null;
}
