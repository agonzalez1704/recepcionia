import { z } from "zod";
import { ok, manejarError } from "@/lib/api";
import { getServerEnv } from "@/lib/env";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { crearIntegracionWhatsAppRepo } from "@/infra/insforge/repos/integracion-whatsapp-repo";
import { comprarNumero, registrarSender, mapearEstado } from "@/infra/twilio/senders";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Input = z.object({
  numero: z.string().min(8), // E.164 elegido de la búsqueda
  pais: z.string().min(2),
  verificacion: z.enum(["sms", "voice"]).default("sms"),
});

export async function POST(req: Request) {
  try {
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") throw new HttpError(403, "no_autorizado", "Solo administradores");

    const env = getServerEnv();
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
      throw new HttpError(503, "twilio_no_configurado", "WhatsApp no está disponible todavía");
    }

    const body = await req.json().catch(() => null);
    const parsed = Input.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "datos_invalidos", "Datos inválidos", parsed.error.flatten());

    const org = ctx.organizacion;
    const repo = crearIntegracionWhatsAppRepo(getInsforgeAdmin());

    // 1. Comprar número en la cuenta parent
    const { telefonoSid, numero } = await comprarNumero(parsed.data.numero);

    // 2. Registrar sender de WhatsApp con el perfil de la clínica
    const webhookUrl = `${env.APP_BASE_URL}/api/webhooks/twilio`;
    const { senderSid, status } = await registrarSender({
      numeroE164: numero,
      perfil: {
        nombre: org.nombre_clinica,
        about: org.sobre_clinica ?? undefined,
        direccion: org.direccion ?? undefined,
        email: org.email ?? undefined,
      },
      webhookUrl,
      verificationMethod: parsed.data.verificacion,
    });

    const estado = mapearEstado(status);
    await repo.guardar(org.id, {
      numero_whatsapp: numero,
      sender_sid: senderSid,
      telefono_sid: telefonoSid,
      pais: parsed.data.pais,
      estado_sender: estado,
      activo: estado === "online",
    });

    return ok({ numero, estado, requiereOtp: estado === "pendiente_otp" });
  } catch (e) {
    return manejarError(e);
  }
}
