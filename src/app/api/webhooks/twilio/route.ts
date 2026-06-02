import { OrganizacionSchema, type Organizacion } from "@/core/entities/organizacion";
import { crearAgendarTurnoService } from "@/core/services/agendar-turno-service";
import { crearProcesarMensajeService } from "@/core/services/procesar-mensaje-service";
import { crearAgenteIA } from "@/infra/openai/agente-ia";
import { crearToolRegistry } from "@/infra/openai/tool-registry";
import {
  agendarTurnoTool,
  cancelarTurnoTool,
  consultarDisponibilidadTool,
  listarMiembrosTool,
  reprogramarTurnoTool,
  verTurnosPacienteTool,
} from "@/infra/openai/tools";
import { crearIntegracionWhatsAppRepo } from "@/infra/insforge/repos/integracion-whatsapp-repo";
import { crearMensajeRepo } from "@/infra/insforge/repos/mensaje-repo";
import { crearMiembroRepo } from "@/infra/insforge/repos/miembro-repo";
import { crearTurnoRepo } from "@/infra/insforge/repos/turno-repo";
import { resolverCalendarProvider } from "@/infra/google/calendar";
import { parseTwilioForm, validarFirmaTwilio, descargarMedia } from "@/infra/twilio/inbound";
import { transcribirAudio } from "@/infra/openai/transcribir";
import { chequearAgente, inicioMesActualIso } from "@/infra/insforge/billing";
import type { AdjuntoEntrante } from "@/core/ports/ia";
import { twimlRespuesta, twimlVacio } from "@/infra/twilio/outbound";
import { desencriptar } from "@/lib/crypto";
import { getServerEnv } from "@/lib/env";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function xml(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  const env = getServerEnv();
  const body = await req.text();
  const form = new URLSearchParams(body);
  const inbound = parseTwilioForm(form);
  const signature = req.headers.get("x-twilio-signature");
  const url = `${env.APP_BASE_URL}/api/webhooks/twilio`;
  const paramsObj: Record<string, string> = {};
  form.forEach((v, k) => { paramsObj[k] = v; });

  const admin = getInsforgeAdmin();
  const integracionRepo = crearIntegracionWhatsAppRepo(admin);

  // Tenant routing por número destino
  const integracion = await integracionRepo.buscarPorNumero(inbound.to);
  if (!integracion) {
    console.warn("Webhook Twilio: número no registrado", { to: inbound.to });
    return xml(twimlVacio());
  }

  // Modelo ISV: validar firma con el auth token de la cuenta parent (env).
  // Compat: si la integración tiene token propio cifrado (modelo viejo), usarlo.
  let authToken = env.TWILIO_AUTH_TOKEN;
  if (!authToken && integracion.twilio_auth_token) {
    try {
      authToken = desencriptar(integracion.twilio_auth_token);
    } catch (err) {
      console.error("No se pudo descifrar auth token:", err);
      return xml(twimlVacio(), 500);
    }
  }
  if (!authToken) {
    console.error("Sin auth token Twilio (ni parent ni por-org)");
    return xml(twimlVacio(), 500);
  }
  const firmaOk = validarFirmaTwilio(authToken, signature, url, paramsObj);
  if (!firmaOk) {
    console.warn("Webhook Twilio: firma inválida");
    return xml(twimlVacio(), 403);
  }

  // Rate limit por (org, paciente)
  const rl = rateLimit(`twilio:${integracion.organizacion_id}:${inbound.from}`, 30, 60_000);
  if (!rl.ok) {
    return xml(twimlRespuesta("Aguantá un momentito, ya te respondo."), 200);
  }

  // Cargar org completa
  const { data: orgData, error: orgErr } = await admin
    .database.from("organizaciones")
    .select("*")
    .eq("id", integracion.organizacion_id);
  if (orgErr || !orgData?.[0]) {
    console.error("No se pudo cargar la organización", orgErr);
    return xml(twimlVacio(), 500);
  }
  const org: Organizacion = OrganizacionSchema.parse(orgData[0]);

  // Gating: requiere suscripción activa + estar bajo el tope mensual.
  const mensajeRepo = crearMensajeRepo(admin);
  const usadas = await mensajeRepo.contarEntrantesDesde(org.id, inicioMesActualIso());
  const chequeo = await chequearAgente(admin, org.id, usadas, env.STRIPE_ENV);
  if (!chequeo.permitido) {
    // Persistir el mensaje entrante igual (queda en el dashboard) pero NO invocar IA.
    await mensajeRepo.crear(org.id, {
      numero_telefono: inbound.from,
      contenido: inbound.body || "(mensaje sin texto)",
      remitente: "paciente",
      metadatos: { gating: chequeo.motivo },
    });
    const tel = org.telefono ? ` Para urgencias llamá al ${org.telefono}.` : "";
    const msg =
      chequeo.motivo === "tope_alcanzado"
        ? `Estamos recibiendo muchas consultas en este momento.${tel} Te respondemos a la brevedad. 🙏`
        : `Gracias por escribir a ${org.nombre_clinica}.${tel} En breve te contactamos. 🙏`;
    // No guardamos esto como "asistente IA" porque no lo generó el agente; va directo.
    return xml(twimlRespuesta(msg));
  }

  // Componer servicios
  const turnoRepo = crearTurnoRepo(admin);
  const miembroRepo = crearMiembroRepo(admin);
  const miembros = await miembroRepo.listar(org.id, true);
  const agendarService = crearAgendarTurnoService({
    turnoRepo,
    resolverCalendar: (miembroId) => resolverCalendarProvider(org.id, miembroId),
    organizacion: org,
    miembros,
  });

  const registry = crearToolRegistry();
  const depsTools = { turnoRepo, agendarService, miembros };
  registry.registrar(consultarDisponibilidadTool(depsTools));
  registry.registrar(verTurnosPacienteTool(depsTools));
  registry.registrar(listarMiembrosTool(depsTools));
  registry.registrar(agendarTurnoTool(depsTools));
  registry.registrar(cancelarTurnoTool(depsTools));
  registry.registrar(reprogramarTurnoTool(depsTools));

  const ia = crearAgenteIA(registry);
  const procesar = crearProcesarMensajeService({ ia, mensajeRepo, organizacion: org, miembros });

  // Procesar adjuntos: imágenes → vision (data URL), audio → Whisper (transcripción).
  let adjuntos: AdjuntoEntrante[] = [];
  let contenido = inbound.body;
  let esVozTranscrita = false;
  if (inbound.media.length > 0) {
    // Modelo ISV: usar SID parent. Compat: SID propio cifrado del modelo viejo.
    const accountSid =
      env.TWILIO_ACCOUNT_SID ||
      (integracion.twilio_account_sid ? desencriptar(integracion.twilio_account_sid) : "");

    const imagenes = inbound.media.filter((m) => m.contentType.startsWith("image/")).slice(0, 4);
    const audios = inbound.media.filter((m) => m.contentType.startsWith("audio/")).slice(0, 2);

    const [imgResults, audioResults] = await Promise.all([
      Promise.all(imagenes.map((m) => descargarMedia(m.url, accountSid, authToken))),
      Promise.all(audios.map((m) => descargarMedia(m.url, accountSid, authToken))),
    ]);

    adjuntos = imgResults
      .filter((r): r is { tipo: string; buffer: Buffer } => r !== null)
      .map((r) => ({ tipo: r.tipo, dataUrl: `data:${r.tipo};base64,${r.buffer.toString("base64")}` }));

    // Transcribir notas de voz y concatenarlas al texto del mensaje.
    const transcripciones = await Promise.all(
      audioResults
        .filter((r): r is { tipo: string; buffer: Buffer } => r !== null)
        .map((r) => transcribirAudio(r.buffer, r.tipo)),
    );
    const textosVoz = transcripciones.filter((t): t is string => !!t);
    if (textosVoz.length > 0) {
      const transcrito = textosVoz.join(" ");
      contenido = contenido.trim() ? `${contenido}\n\n${transcrito}` : transcrito;
      esVozTranscrita = true;
    }
  }

  try {
    const respuesta = await procesar.procesar({
      numeroPaciente: inbound.from,
      contenido,
      messageSid: inbound.messageSid,
      adjuntos,
      esVozTranscrita,
    });
    return xml(twimlRespuesta(respuesta));
  } catch (err) {
    console.error("Error procesando mensaje:", err);
    const fallback = `Disculpá, estoy teniendo problemas técnicos${
      org.telefono ? `. Probá llamar al ${org.telefono}` : ""
    }.`;
    return xml(twimlRespuesta(fallback));
  }
}
