import { createHmac, timingSafeEqual } from "node:crypto";
import { OrganizacionSchema, type Organizacion } from "@/core/entities/organizacion";
import { getServerEnv } from "@/lib/env";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { desencriptar, encriptar } from "@/lib/crypto";
import { crearIntegracionWhatsAppRepo } from "@/infra/insforge/repos/integracion-whatsapp-repo";
import { crearMensajeRepo } from "@/infra/insforge/repos/mensaje-repo";
import { construirProcesador } from "@/infra/agente/runtime";
import { chequearAgente, inicioMesActualIso } from "@/infra/insforge/billing";
import { crearWebhookMensajes, enviarTexto } from "@/infra/kapso/client";
import { transcribirAudio } from "@/infra/openai/transcribir";
import type { AdjuntoEntrante } from "@/core/ports/ia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Handshake de verificación (GET de Kapso/Meta) para marcar el webhook verificado.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const challenge = url.searchParams.get("hub.challenge") ?? url.searchParams.get("challenge");
  if (challenge) return new Response(challenge, { status: 200 });
  return new Response("ok", { status: 200 });
}

function firmaValida(secret: string, raw: string, firma: string | null): boolean {
  if (!secret || !firma) return false;
  const esperado = createHmac("sha256", secret).update(raw).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(esperado), Buffer.from(firma));
  } catch {
    return false;
  }
}

async function cargarOrg(admin: ReturnType<typeof getInsforgeAdmin>, orgId: string): Promise<Organizacion | null> {
  const { data } = await admin.database.from("organizaciones").select("*").eq("id", orgId);
  const row = (data as unknown[] | null)?.[0];
  return row ? OrganizacionSchema.parse(row) : null;
}

type MensajeExtraido = {
  numeroPaciente: string;
  contenido: string;
  esVozTranscrita: boolean;
  adjuntos: AdjuntoEntrante[];
};

// Extrae el contenido de UN evento whatsapp.message.received (texto / audio / imagen).
async function extraerMensaje(ev: Record<string, unknown>, apiKey: string): Promise<MensajeExtraido> {
  const msg = (ev.message ?? {}) as {
    type?: string;
    text?: { body?: string };
    kapso?: { content?: string; transcript?: { text?: string }; media_url?: string; media_data?: { content_type?: string } };
  };
  const conv = (ev.conversation ?? {}) as { phone_number?: string };
  const numeroPaciente = conv.phone_number ?? "";

  const esAudio = msg.type === "audio";
  let contenido = msg.text?.body ?? "";
  let vozTranscrita = false;

  // Notas de voz: Kapso a veces adjunta el transcript; si no, descargamos el
  // audio y lo transcribimos con Whisper.
  if (esAudio) {
    const transcript = msg.kapso?.transcript?.text;
    if (transcript) {
      contenido = transcript;
      vozTranscrita = true;
    } else if (msg.kapso?.media_url) {
      try {
        const r = await fetch(msg.kapso.media_url, {
          headers: { "X-API-Key": apiKey },
          signal: AbortSignal.timeout(15_000),
        });
        if (r.ok) {
          const mime = msg.kapso.media_data?.content_type ?? r.headers.get("content-type") ?? "audio/ogg";
          const buf = Buffer.from(await r.arrayBuffer());
          const t = await transcribirAudio(buf, mime);
          if (t) {
            contenido = t;
            vozTranscrita = true;
          }
        }
      } catch (err) {
        console.error("No se pudo transcribir audio Kapso:", err);
      }
    }
  }

  if (!contenido && msg.kapso?.content) contenido = msg.kapso.content;

  const adjuntos: AdjuntoEntrante[] = [];
  if (msg.type === "image" && msg.kapso?.media_url) {
    try {
      const r = await fetch(msg.kapso.media_url, {
        headers: { "X-API-Key": apiKey },
        signal: AbortSignal.timeout(15_000),
      });
      if (r.ok) {
        const tipo = msg.kapso.media_data?.content_type ?? r.headers.get("content-type") ?? "image/jpeg";
        const buf = Buffer.from(await r.arrayBuffer());
        adjuntos.push({ tipo, dataUrl: `data:${tipo};base64,${buf.toString("base64")}` });
      }
    } catch (err) {
      console.error("No se pudo descargar media Kapso:", err);
    }
  }

  return { numeroPaciente, contenido, esVozTranscrita: vozTranscrita, adjuntos };
}

export async function POST(req: Request) {
  const env = getServerEnv();
  const raw = await req.text();
  const evento = req.headers.get("x-webhook-event") ?? "";
  const firma = req.headers.get("x-webhook-signature");

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const admin = getInsforgeAdmin();
  const repo = crearIntegracionWhatsAppRepo(admin);

  // -------- Lifecycle: número conectado (project webhook) --------
  if (evento === "whatsapp.phone_number.created") {
    if (!firmaValida(env.KAPSO_PROJECT_WEBHOOK_SECRET, raw, firma)) {
      return new Response("firma inválida", { status: 403 });
    }
    const phoneNumberId = String(payload.phone_number_id ?? "");
    const customer = (payload.customer ?? {}) as { id?: string };
    const businessAccountId = (payload as { business_account_id?: string }).business_account_id ?? null;
    const displayNumber = (payload as { display_phone_number?: string }).display_phone_number ?? null;
    if (!phoneNumberId || !customer.id) return new Response(null, { status: 200 });

    // Buscar la integración por kapso_customer_id
    const { data } = await admin
      .database.from("integraciones_whatsapp")
      .select("*")
      .eq("kapso_customer_id", customer.id);
    const integ = (data as { organizacion_id: string }[] | null)?.[0];
    if (!integ) return new Response(null, { status: 200 });

    // Registrar webhook de mensajes para este número
    let webhookSecret = "";
    try {
      const wh = await crearWebhookMensajes(phoneNumberId, `${env.APP_BASE_URL}/api/webhooks/kapso`);
      webhookSecret = wh.secret;
    } catch (err) {
      console.error("No se pudo crear webhook de mensajes Kapso:", err);
    }

    await repo.guardar(integ.organizacion_id, {
      phone_number_id: phoneNumberId,
      business_account_id: businessAccountId ?? undefined,
      display_phone_number: displayNumber ?? undefined,
      numero_whatsapp: displayNumber ?? undefined,
      estado_sender: "online",
      activo: true,
      ...(webhookSecret ? { webhook_secret: encriptar(webhookSecret) } : {}),
    });
    return new Response(null, { status: 200 });
  }

  // -------- Mensaje entrante (phone-number webhook) --------
  if (evento === "whatsapp.message.received") {
    // Soporta entrega simple y batch (buffering): { batch:true, data:[ev,...] }.
    // Mensajes rápidos del mismo paciente se juntan en un solo turno del agente.
    const esBatch = payload.batch === true && Array.isArray(payload.data);
    const eventos = (esBatch ? payload.data : [payload]) as Record<string, unknown>[];

    const phoneNumberId = String(payload.phone_number_id ?? eventos[0]?.phone_number_id ?? "");
    if (!phoneNumberId) return new Response(null, { status: 200 });

    const integ = await repo.buscarPorPhoneNumberId(phoneNumberId);
    if (!integ || !integ.activo) return new Response(null, { status: 200 });

    // Verificar firma sobre el body crudo (cubre simple y batch)
    const secret = integ.webhook_secret ? desencriptar(integ.webhook_secret) : "";
    if (!firmaValida(secret, raw, firma)) {
      console.warn("Webhook Kapso: firma de mensaje inválida");
      return new Response("firma inválida", { status: 403 });
    }

    const org = await cargarOrg(admin, integ.organizacion_id);
    if (!org) return new Response(null, { status: 200 });

    // Extraer cada evento y fusionarlos en un turno
    const extraidos = await Promise.all(eventos.map((ev) => extraerMensaje(ev, env.KAPSO_API_KEY)));
    const numeroPaciente = extraidos.find((e) => e.numeroPaciente)?.numeroPaciente ?? "";
    if (!numeroPaciente) return new Response(null, { status: 200 });

    const contenido = extraidos.map((e) => e.contenido).filter(Boolean).join("\n");
    const adjuntos = extraidos.flatMap((e) => e.adjuntos);
    const esVozTranscrita = extraidos.some((e) => e.esVozTranscrita);

    // Gating: suscripción activa + tope
    const usadas = await crearMensajeRepo(admin).contarEntrantesDesde(org.id, inicioMesActualIso());
    const chequeo = await chequearAgente(admin, org.id, usadas, env.STRIPE_ENV);

    const { procesar, mensajeRepo } = await construirProcesador(admin, org);

    if (!chequeo.permitido) {
      await mensajeRepo.crear(org.id, {
        numero_telefono: numeroPaciente,
        contenido: contenido || "(mensaje sin texto)",
        remitente: "paciente",
        metadatos: { gating: chequeo.motivo },
      });
      return new Response(null, { status: 200 });
    }

    try {
      const respuesta = await procesar.procesar({ numeroPaciente, contenido, adjuntos, esVozTranscrita });
      await enviarTexto(phoneNumberId, numeroPaciente, respuesta);
    } catch (err) {
      console.error("Error procesando mensaje Kapso:", err);
    }
    return new Response(null, { status: 200 });
  }

  // Evento no manejado
  return new Response(null, { status: 200 });
}
