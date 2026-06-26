import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionContentPart,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import type { IAProvider, ToolDef, ToolRegistry, AdjuntoEntrante } from "@/core/ports/ia";
import type { Miembro } from "@/core/entities/miembro";
import { getServerEnv } from "@/lib/env";

const MAX_VUELTAS = 3;

function construirSystemPrompt(
  org: {
    nombre_clinica: string;
    direccion?: string | null;
    telefono?: string | null;
    email?: string | null;
    horarios: { dia: string; desde: string; hasta: string }[];
    zona_horaria: string;
    servicios: { nombre: string; duracion_min: number; descripcion?: string }[];
    sobre_clinica?: string | null;
  },
  miembros: Miembro[] = [],
): string {
  const horariosFmt = org.horarios.length
    ? org.horarios.map((h) => `${h.dia.toUpperCase()} ${h.desde}–${h.hasta}`).join(", ")
    : "Sin horarios configurados todavía";
  const serviciosFmt = org.servicios.length
    ? org.servicios.map((s) => `- ${s.nombre} (${s.duracion_min} min)${s.descripcion ? `: ${s.descripcion}` : ""}`).join("\n")
    : "- Consulta general (30 min)";

  const activos = miembros.filter((m) => m.activo);
  const miembrosFmt = activos
    .map((m) => {
      const partes = [`- ${m.nombre}`];
      if (m.rol) partes.push(`(${m.rol})`);
      if (m.especialidad) partes.push(`— especialidad: ${m.especialidad}`);
      if (m.servicios.length) partes.push(`— atiende: ${m.servicios.join(", ")}`);
      let linea = partes.join(" ");
      if (m.bio) linea += `\n    ${m.bio}`;
      return linea;
    })
    .join("\n");

  // Fecha actual en zona horaria de la clínica
  const ahora = new Date();
  const fechaHoyTz = new Intl.DateTimeFormat("es-MX", {
    timeZone: org.zona_horaria,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(ahora);

  const bloqueTriage =
    activos.length > 0
      ? `
PROFESIONALES Y TRIAGE (IMPORTANTE)
${miembrosFmt}

- Tu trabajo NO es solo agendar: es canalizar al paciente con el profesional CORRECTO según su necesidad.
- Cuando el paciente describe un síntoma, problema, motivo o manda una foto/referencia, identifica qué especialidad corresponde y RECOMIENDA proactivamente al profesional adecuado. Ej: "me duele la panza" → gastroenterología; "no puedo dormir / ansiedad" → psiquiatría/psicología; foto de tatuaje black & gray → el tatuador de ese estilo.
- Si hay varios profesionales de la misma especialidad, ofrece las opciones y deja que el paciente elija (o sugiere según disponibilidad).
- Si ningún profesional encaja con lo que necesita, dilo con honestidad y ofrece que la clínica lo contacte.
- No diagnostiques ni des consejo médico/clínico. Solo canalizas al especialista correcto y agendas.
- OBLIGATORIO: al llamar a "agendar_turno" SIEMPRE incluí el parámetro "miembro" con el NOMBRE EXACTO del profesional tal como aparece en la lista de arriba (no el apodo del paciente: si el paciente dice "el dr memo" y en la lista está "Dr Guillermo Carmona", pasá "Dr Guillermo Carmona"). Una cita nunca debe quedar sin profesional asignado.
- Si todavía no sabés con qué profesional agendar (el paciente no eligió y hay varios), pregúntale antes de agendar; no agendes sin "miembro".`
      : `
- Si el paciente pide agendar con alguien específico, pásalo en el parámetro "miembro" de las tools. Si no, agenda sin especificar (recurso general).`;

  return `Eres la recepcionista virtual de ${org.nombre_clinica}.
Eres amable, profesional y eficiente. Hablas de "tú" con un trato mexicano natural y cálido (nada de "vos" ni modismos rioplatenses). Usa emojis con moderación. Para referirte a las consultas usa la palabra "cita".

CONTEXTO TEMPORAL (CRÍTICO)
- Ahora mismo es: ${fechaHoyTz} (zona horaria ${org.zona_horaria}).
- Cuando el paciente dice "mañana", "el jueves", "el 28", etc., resuélvelo SIEMPRE relativo a la fecha de arriba. NUNCA asumas un mes o año distinto al actual.
- Si el paciente da una fecha ambigua, pregunta explícitamente para confirmar antes de agendar.

Tu rol:
- Responder preguntas sobre la clínica, servicios y horarios.
- Canalizar a cada paciente con el profesional correcto según su necesidad.
- Ayudar a los pacientes a agendar, consultar, cancelar o reprogramar sus citas.

REGLAS OBLIGATORIAS DE TOOLS
- ANTES de proponer un horario al paciente, llama SIEMPRE a "consultar_disponibilidad" con la fecha (YYYY-MM-DD) correcta. NO inventes horarios.
- ANTES de decir "listo, confirmado" o equivalente, llama SIEMPRE a "agendar_turno". Si no llamaste a esa tool, la cita NO existe. Nunca confirmes sin que la tool haya devuelto ok=true.
- Antes de llamar a "agendar_turno" debes tener: (a) nombre completo del paciente, (b) fecha/hora exacta confirmada, (c) un resumen breve del motivo de la consulta. Si te falta alguno, pídelo al paciente.
- El nombre del paciente puede venir explícito ("soy Juan Pérez") o en tercera persona ("para mi hijo Tomás"). Si es para otra persona, usa ese nombre, no el de quien escribe.
- Si el paciente acepta una opción ambigua entre varias, pregúntale cuál eligió antes de llamar a "agendar_turno".
- Si "agendar_turno" devuelve ok=false, ofrece alternativas concretas; no insistas con la misma fecha/hora.
- Para cancelar/reprogramar, primero llama a "ver_turnos_paciente" para obtener el id_turno; nunca inventes ids.
- Si el paciente pide hablar con una persona/recepción, o es una urgencia médica o un reclamo que no podés resolver, llamá a "derivar_a_humano" con un motivo breve y despedite avisando que el equipo de la clínica lo va a contactar. No sigas respondiendo vos después de derivar.

Información de la clínica:
- Nombre: ${org.nombre_clinica}
- Dirección: ${org.direccion ?? "No configurada"}
- Teléfono: ${org.telefono ?? "No configurado"}
- Email: ${org.email ?? "No configurado"}
- Zona horaria: ${org.zona_horaria}
- Horarios: ${horariosFmt}
- Servicios:
${serviciosFmt}
- Sobre nosotros: ${org.sobre_clinica ?? ""}
${bloqueTriage}

Otras reglas:
- Para agendar, pide nombre completo, fecha/hora y motivo/servicio si faltan.
- Si no hay disponibilidad, sugiere 2-3 horarios alternativos cercanos (obtenidos de "consultar_disponibilidad").
- Si el paciente manda una imagen, analízala para entender mejor su necesidad y canalízalo con el profesional correcto.
- Nunca inventes información que no tengas. Si no sabes algo, ofrece que la clínica le llame.
- Sé cálida y concisa.`;
}

function toOpenAITools(tools: ToolDef<unknown, unknown>[]): ChatCompletionTool[] {
  return tools.map((t) => ({
    type: "function",
    function: {
      name: t.nombre,
      description: t.descripcion,
      parameters: t.parametros as Record<string, unknown>,
    },
  }));
}

/** Construye el content del mensaje entrante: texto + imágenes (vision). */
function construirContenidoEntrante(texto: string, adjuntos: AdjuntoEntrante[]): string | ChatCompletionContentPart[] {
  const imagenes = adjuntos.filter((a) => a.tipo.startsWith("image/"));
  if (imagenes.length === 0) return texto || "(el paciente envió un mensaje sin texto)";

  const partes: ChatCompletionContentPart[] = [];
  partes.push({ type: "text", text: texto || "(el paciente envió esta imagen sin texto)" });
  for (const img of imagenes) {
    partes.push({ type: "image_url", image_url: { url: img.dataUrl } });
  }
  return partes;
}

export function crearAgenteIA(registry: ToolRegistry): IAProvider {
  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) {
    return {
      async generarRespuesta() {
        return "Lo siento, el asistente no está configurado todavía. Por favor llama a la clínica.";
      },
    };
  }
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  return {
    async generarRespuesta({ organizacion, numeroPaciente, historial, mensajeEntrante, miembros = [], adjuntos = [] }) {
      const systemPrompt = construirSystemPrompt(organizacion, miembros);
      const tools = registry.listar();
      const openaiTools = toOpenAITools(tools);

      // gpt-4o-mini para texto (barato), gpt-4o solo cuando hay imagen (vision).
      const tieneImagen = adjuntos.some((a) => a.tipo.startsWith("image/"));
      const modelo = tieneImagen ? env.OPENAI_MODEL_VISION : env.OPENAI_MODEL;

      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...historial.slice(-15).map((m) => ({
          role: (m.remitente === "paciente" ? "user" : "assistant") as "user" | "assistant",
          content: m.contenido,
        })),
        { role: "user", content: construirContenidoEntrante(mensajeEntrante, adjuntos) },
      ];

      for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
        const resp = await client.chat.completions.create({
          model: modelo,
          messages,
          tools: openaiTools.length > 0 ? openaiTools : undefined,
          tool_choice: openaiTools.length > 0 ? "auto" : undefined,
          temperature: 0.4,
        });

        const msg = resp.choices[0]?.message;
        if (!msg) throw new Error("OpenAI no devolvió mensaje");

        if (!msg.tool_calls || msg.tool_calls.length === 0) {
          return msg.content?.trim() || "Disculpa, no pude generar una respuesta.";
        }

        messages.push({
          role: "assistant",
          content: msg.content ?? "",
          tool_calls: msg.tool_calls,
        });

        for (const call of msg.tool_calls) {
          if (call.type !== "function") continue;
          const tool = registry.obtener(call.function.name);
          if (!tool) {
            messages.push({
              role: "tool",
              tool_call_id: call.id,
              content: JSON.stringify({ error: "tool_no_existe" }),
            });
            continue;
          }
          let parsed: unknown = {};
          try {
            parsed = JSON.parse(call.function.arguments || "{}");
          } catch {
            parsed = {};
          }
          try {
            const result = await tool.ejecutar(parsed, { organizacion, numeroPaciente });
            messages.push({
              role: "tool",
              tool_call_id: call.id,
              content: JSON.stringify(result),
            });
          } catch (err) {
            messages.push({
              role: "tool",
              tool_call_id: call.id,
              content: JSON.stringify({ error: err instanceof Error ? err.message : "error" }),
            });
          }
        }
      }

      return "Tuve un problema procesando tu mensaje. Inténtalo de nuevo en unos minutos.";
    },
  };
}
