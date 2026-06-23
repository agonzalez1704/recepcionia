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
import type { AdjuntoEntrante } from "@/core/ports/ia";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

// Diagnóstico temporal: GET /api/webhooks/kapso?diag=<token>&pnid=<id>
// No expone secretos, solo host + flags. Borrar después del test.
export async function GET(req: Request) {
  const env = getServerEnv();
  const url = new URL(req.url);
  if (url.searchParams.get("diag") !== (env.CRON_SECRET || "diag")) {
    return new Response(null, { status: 200 });
  }
  const pnid = url.searchParams.get("pnid") ?? "";
  const admin = getInsforgeAdmin();
  let found = false;
  let activo: boolean | null = null;
  let secretOk: boolean | null = null;
  let orgId: string | null = null;
  try {
    const integ = await crearIntegracionWhatsAppRepo(admin).buscarPorPhoneNumberId(pnid);
    found = !!integ;
    activo = integ?.activo ?? null;
    orgId = integ?.organizacion_id ?? null;
    if (integ?.webhook_secret) {
      try {
        secretOk = desencriptar(integ.webhook_secret).length > 0;
      } catch {
        secretOk = false;
      }
    }
  } catch (e) {
    return Response.json({ error: String(e), insforge: env.NEXT_PUBLIC_INSFORGE_BASE_URL }, { status: 200 });
  }
  return Response.json({
    insforge: env.NEXT_PUBLIC_INSFORGE_BASE_URL,
    pnid,
    found,
    activo,
    orgId,
    secretDescifrable: secretOk,
    tieneOpenAI: !!env.OPENAI_API_KEY,
    tieneKapso: !!env.KAPSO_API_KEY,
    billingDisabled: env.BILLING_DISABLED,
    stripeEnv: env.STRIPE_ENV,
  });
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
    const phoneNumberId = String(payload.phone_number_id ?? "");
    if (!phoneNumberId) return new Response(null, { status: 200 });

    const integ = await repo.buscarPorPhoneNumberId(phoneNumberId);
    if (!integ || !integ.activo) return new Response(null, { status: 200 });

    // Verificar firma con el secret del webhook de este número
    const secret = integ.webhook_secret ? desencriptar(integ.webhook_secret) : "";
    if (!firmaValida(secret, raw, firma)) {
      console.warn("Webhook Kapso: firma de mensaje inválida");
      return new Response("firma inválida", { status: 403 });
    }

    const org = await cargarOrg(admin, integ.organizacion_id);
    if (!org) return new Response(null, { status: 200 });

    // Extraer datos del mensaje
    const msg = (payload.message ?? {}) as {
      type?: string;
      text?: { body?: string };
      kapso?: { content?: string; transcript?: { text?: string }; media_url?: string; media_data?: { content_type?: string } };
    };
    const conv = (payload.conversation ?? {}) as { phone_number?: string };
    const numeroPaciente = conv.phone_number ?? "";
    if (!numeroPaciente) return new Response(null, { status: 200 });

    const esAudio = msg.type === "audio";
    const transcript = msg.kapso?.transcript?.text;
    let contenido = msg.text?.body ?? "";
    if (esAudio && transcript) contenido = transcript;
    if (!contenido && msg.kapso?.content) contenido = msg.kapso.content;

    // Imagen → vision: descargar media_url (público de Kapso) como data URL
    const adjuntos: AdjuntoEntrante[] = [];
    if (msg.type === "image" && msg.kapso?.media_url) {
      try {
        const r = await fetch(msg.kapso.media_url, {
          headers: { "X-API-Key": env.KAPSO_API_KEY },
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
      const respuesta = await procesar.procesar({
        numeroPaciente,
        contenido,
        adjuntos,
        esVozTranscrita: esAudio && !!transcript,
      });
      await enviarTexto(phoneNumberId, numeroPaciente, respuesta);
    } catch (err) {
      console.error("Error procesando mensaje Kapso:", err);
    }
    return new Response(null, { status: 200 });
  }

  // Evento no manejado
  return new Response(null, { status: 200 });
}
