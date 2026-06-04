import { z } from "zod";
import { ok, manejarError } from "@/lib/api";
import { getServerEnv } from "@/lib/env";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { crearIntegracionWhatsAppRepo } from "@/infra/insforge/repos/integracion-whatsapp-repo";
import { asegurarCustomer, crearSetupLink } from "@/infra/kapso/client";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const Input = z.object({
  tipo: z.enum(["coexistence", "dedicated", "ambos"]).default("ambos"),
});

export async function POST(req: Request) {
  try {
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") throw new HttpError(403, "no_autorizado", "Solo administradores");

    const env = getServerEnv();
    if (!env.KAPSO_API_KEY) throw new HttpError(503, "kapso_no_configurado", "WhatsApp no disponible todavía");

    const body = await req.json().catch(() => ({}));
    const parsed = Input.safeParse(body);
    const tipo = parsed.success ? parsed.data.tipo : "ambos";
    const allowed =
      tipo === "ambos" ? (["coexistence", "dedicated"] as const) : ([tipo] as ("coexistence" | "dedicated")[]);

    const org = ctx.organizacion;
    const customerId = await asegurarCustomer(org.clerk_org_id, org.nombre_clinica);

    const { url, expiresAt } = await crearSetupLink(customerId, {
      language: "es",
      allowedConnectionTypes: [...allowed],
      successRedirectUrl: `${env.APP_BASE_URL}/integraciones?wa=ok`,
      failureRedirectUrl: `${env.APP_BASE_URL}/integraciones?wa=error`,
      themeConfig: { primary_color: "#1E40AF" },
    });

    // Guardar el customer id (la fila se completa al recibir phone_number.created)
    const repo = crearIntegracionWhatsAppRepo(getInsforgeAdmin());
    await repo.guardar(org.id, { kapso_customer_id: customerId, estado_sender: "creando" });

    return ok({ url, expiresAt });
  } catch (e) {
    return manejarError(e);
  }
}
