import { ok, manejarError } from "@/lib/api";
import { getServerEnv } from "@/lib/env";
import { getInsforgeUserClient } from "@/lib/insforge-user";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") {
      throw new HttpError(403, "no_autorizado", "Solo administradores pueden gestionar la suscripción");
    }
    const env = getServerEnv();
    const client = await getInsforgeUserClient();
    const { data, error } = await client.payments.createCustomerPortalSession(env.STRIPE_ENV, {
      subject: { type: "org", id: ctx.organizacion.id },
      returnUrl: `${env.APP_BASE_URL}/facturacion`,
    });
    if (error) {
      // 404 = no hay customer todavía (nunca pagó)
      throw new HttpError(404, "sin_suscripcion", "Todavía no tenés una suscripción activa");
    }
    const url = data?.customerPortalSession.url;
    if (!url) throw new HttpError(502, "stripe_error", "Stripe no devolvió URL del portal");
    return ok({ url });
  } catch (e) {
    return manejarError(e);
  }
}
