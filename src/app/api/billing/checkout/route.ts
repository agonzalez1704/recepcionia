import { z } from "zod";
import { ok, manejarError } from "@/lib/api";
import { getServerEnv } from "@/lib/env";
import { getInsforgeUserClient } from "@/lib/insforge-user";
import { getPlan, type PlanId } from "@/core/billing/planes";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";
import { currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

const Input = z.object({ planId: z.enum(["esencial", "profesional", "clinica"]) });

export async function POST(req: Request) {
  try {
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") {
      throw new HttpError(403, "no_autorizado", "Solo administradores pueden gestionar la suscripción");
    }
    const body = await req.json().catch(() => null);
    const parsed = Input.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "datos_invalidos", "Plan inválido");

    const env = getServerEnv();
    const plan = getPlan(parsed.data.planId as PlanId);
    const priceId = (env as unknown as Record<string, string>)[plan.stripePriceIdEnv];
    if (!priceId) {
      throw new HttpError(503, "stripe_no_configurado", `Falta configurar el precio del plan ${plan.nombre}`);
    }

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress ?? ctx.organizacion.email ?? null;

    const client = await getInsforgeUserClient();
    const { data, error } = await client.payments.createCheckoutSession(env.STRIPE_ENV, {
      mode: "subscription",
      lineItems: [{ stripePriceId: priceId, quantity: 1 }],
      successUrl: `${env.APP_BASE_URL}/facturacion?checkout=ok`,
      cancelUrl: `${env.APP_BASE_URL}/facturacion?checkout=cancel`,
      subject: { type: "org", id: ctx.organizacion.id },
      customerEmail: email,
      // Cada intento de checkout es único (las sessions de Stripe son single-use).
      idempotencyKey: `sub:${ctx.organizacion.id}:${plan.id}:${Date.now()}`,
    });

    if (error) throw new HttpError(502, "stripe_error", error.message ?? "Error creando checkout", error);
    const url = data?.checkoutSession.url;
    if (!url) throw new HttpError(502, "stripe_error", "Stripe no devolvió URL de checkout");

    return ok({ url });
  } catch (e) {
    return manejarError(e);
  }
}
