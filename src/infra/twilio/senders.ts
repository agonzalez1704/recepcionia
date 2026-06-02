import twilio from "twilio";
import { getServerEnv } from "@/lib/env";

/**
 * Cliente Twilio de la cuenta parent (modelo ISV). Un solo par de credenciales
 * para todos los tenants. Los senders de WhatsApp se registran bajo nuestra WABA
 * (TWILIO_WABA_ID) pero cada uno lleva el perfil de su clínica.
 */
function parentClient() {
  const env = getServerEnv();
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio no configurado (TWILIO_ACCOUNT_SID/AUTH_TOKEN faltantes)");
  }
  return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}

export type NumeroDisponible = {
  numero: string; // E.164
  amigable: string;
  pais: string;
};

/** Busca números disponibles con capacidad SMS+voz en un país. */
export async function buscarNumerosDisponibles(pais: string, limite = 5): Promise<NumeroDisponible[]> {
  const client = parentClient();
  const lista = await client
    .availablePhoneNumbers(pais)
    .local.list({ smsEnabled: true, voiceEnabled: true, limit: limite });
  return lista.map((n) => ({ numero: n.phoneNumber, amigable: n.friendlyName, pais }));
}

/** Compra un número en la cuenta parent. Devuelve el SID (PN...) y el número. */
export async function comprarNumero(numeroE164: string): Promise<{ telefonoSid: string; numero: string }> {
  const client = parentClient();
  const comprado = await client.incomingPhoneNumbers.create({ phoneNumber: numeroE164 });
  return { telefonoSid: comprado.sid, numero: comprado.phoneNumber };
}

export type PerfilClinica = {
  nombre: string;
  about?: string;
  direccion?: string;
  email?: string;
  websites?: string[];
  logoUrl?: string;
};

const VERTICAL = "PROFESSIONAL_SERVICES";

/**
 * Registra un sender de WhatsApp para el número, bajo nuestra WABA, con el
 * perfil de la clínica (nombre/logo/etc. que verá el paciente). Setea el webhook.
 * Devuelve el sender SID + estado. Puede requerir OTP (status PENDING_VERIFICATION).
 */
export async function registrarSender(input: {
  numeroE164: string;
  perfil: PerfilClinica;
  webhookUrl: string;
  verificationMethod?: "sms" | "voice";
}): Promise<{ senderSid: string; status: string }> {
  const env = getServerEnv();
  const client = parentClient();

  const sender = await client.messaging.v2.channelsSenders.create({
    senderId: `whatsapp:${input.numeroE164}`,
    configuration: {
      wabaId: env.TWILIO_WABA_ID || undefined,
      verificationMethod: input.verificationMethod ?? "sms",
    },
    webhook: {
      callbackUrl: input.webhookUrl,
      callbackMethod: "POST",
    },
    profile: {
      name: input.perfil.nombre,
      about: input.perfil.about,
      address: input.perfil.direccion,
      logoUrl: input.perfil.logoUrl,
      vertical: VERTICAL,
      websites: input.perfil.websites,
      emails: input.perfil.email ? [input.perfil.email] : undefined,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  return { senderSid: sender.sid, status: sender.status };
}

/** Envía el código OTP recibido para verificar el sender. */
export async function verificarSender(senderSid: string, codigo: string): Promise<{ status: string }> {
  const client = parentClient();
  const s = await client.messaging.v2
    .channelsSenders(senderSid)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ configuration: { verificationCode: codigo } } as any);
  return { status: s.status };
}

/** Estado actual del sender (CREATING, PENDING_VERIFICATION, ONLINE, OFFLINE...). */
export async function estadoSender(senderSid: string): Promise<{ status: string; offlineReasons?: unknown }> {
  const client = parentClient();
  const s = await client.messaging.v2.channelsSenders(senderSid).fetch();
  return { status: s.status, offlineReasons: (s as unknown as { offlineReasons?: unknown }).offlineReasons };
}

/** Da de baja: elimina sender y libera/elimina el número comprado. */
export async function eliminarSender(senderSid: string, telefonoSid?: string | null): Promise<void> {
  const client = parentClient();
  try {
    await client.messaging.v2.channelsSenders(senderSid).remove();
  } catch (err) {
    console.error("No se pudo eliminar sender:", err);
  }
  if (telefonoSid) {
    try {
      await client.incomingPhoneNumbers(telefonoSid).remove();
    } catch (err) {
      console.error("No se pudo liberar número:", err);
    }
  }
}

/** Mapea status de Twilio a nuestro estado_sender interno. */
export function mapearEstado(statusTwilio: string): string {
  switch (statusTwilio) {
    case "CREATING":
    case "VERIFYING":
      return "creando";
    case "PENDING_VERIFICATION":
      return "pendiente_otp";
    case "TWILIO_REVIEW":
      return "en_revision";
    case "ONLINE":
      return "online";
    case "OFFLINE":
    case "DRAFT":
      return "offline";
    default:
      return "creando";
  }
}
