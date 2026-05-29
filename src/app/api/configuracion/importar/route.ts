import { z } from "zod";
import OpenAI from "openai";
import { ok, manejarError } from "@/lib/api";
import { getServerEnv } from "@/lib/env";
import { htmlATexto } from "@/lib/html-text";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const Input = z.object({ url: z.string().url() });

const ExtraidoSchema = z.object({
  nombre_clinica: z.string().nullable(),
  direccion: z.string().nullable(),
  telefono: z.string().nullable(),
  email: z.string().nullable(),
  zona_horaria: z.string().nullable(),
  sobre_clinica: z.string().nullable(),
  horarios: z
    .array(
      z.object({
        dia: z.enum(["lun", "mar", "mie", "jue", "vie", "sab", "dom"]),
        desde: z.string().regex(/^\d{2}:\d{2}$/),
        hasta: z.string().regex(/^\d{2}:\d{2}$/),
      }),
    )
    .default([]),
  servicios: z
    .array(
      z.object({
        nombre: z.string(),
        duracion_min: z.number().int().positive().default(30),
        descripcion: z.string().default(""),
      }),
    )
    .default([]),
});

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    nombre_clinica: { type: ["string", "null"] },
    direccion: { type: ["string", "null"] },
    telefono: { type: ["string", "null"] },
    email: { type: ["string", "null"] },
    zona_horaria: {
      type: ["string", "null"],
      description: "IANA timezone, ej. America/Mexico_City. Inferí del país si no aparece explícito.",
    },
    sobre_clinica: { type: ["string", "null"], description: "Párrafo corto sobre la clínica" },
    horarios: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          dia: { type: "string", enum: ["lun", "mar", "mie", "jue", "vie", "sab", "dom"] },
          desde: { type: "string", description: "HH:MM 24h" },
          hasta: { type: "string", description: "HH:MM 24h" },
        },
        required: ["dia", "desde", "hasta"],
      },
    },
    servicios: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          nombre: { type: "string" },
          duracion_min: { type: "integer", description: "Duración estimada en minutos, default 30 si no aparece" },
          descripcion: { type: "string" },
        },
        required: ["nombre", "duracion_min", "descripcion"],
      },
    },
  },
  required: [
    "nombre_clinica",
    "direccion",
    "telefono",
    "email",
    "zona_horaria",
    "sobre_clinica",
    "horarios",
    "servicios",
  ],
};

export async function POST(req: Request) {
  try {
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") {
      throw new HttpError(403, "no_autorizado", "Solo administradores pueden importar configuración");
    }

    const body = await req.json().catch(() => null);
    const parsed = Input.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "datos_invalidos", "URL inválida", parsed.error.flatten());

    const env = getServerEnv();
    if (!env.OPENAI_API_KEY) {
      throw new HttpError(503, "openai_no_configurado", "OpenAI no está configurado");
    }

    // Fetch HTML
    let html: string;
    try {
      const res = await fetch(parsed.data.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RecepcionIA-Importer/1.0)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        throw new HttpError(502, "fetch_falló", `La página respondió ${res.status}`);
      }
      html = await res.text();
    } catch (err) {
      if (err instanceof HttpError) throw err;
      throw new HttpError(502, "fetch_falló", "No pudimos acceder a esa URL");
    }

    const texto = htmlATexto(html).slice(0, 12_000);

    // Extraer con OpenAI structured output
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const resp = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Extraés información estructurada de páginas web de clínicas/consultorios médicos. Solo devolvés datos que aparezcan explícitamente en el texto. Si un dato no está, devolvé null. Para horarios, normalizá a HH:MM 24h y mapeá los días (lun, mar, mie, jue, vie, sab, dom). Para servicios, listá cada uno con duración estimada (30 min default si no se aclara).",
        },
        {
          role: "user",
          content: `URL: ${parsed.data.url}\n\nContenido extraído:\n\n${texto}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "datos_clinica",
          strict: true,
          schema: RESPONSE_SCHEMA,
        },
      },
    });

    const content = resp.choices[0]?.message?.content;
    if (!content) throw new HttpError(502, "ia_sin_respuesta", "OpenAI no devolvió contenido");

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(content);
    } catch {
      throw new HttpError(502, "ia_json_invalido", "La IA no devolvió JSON válido");
    }

    const datos = ExtraidoSchema.parse(rawJson);

    return ok(datos);
  } catch (e) {
    return manejarError(e);
  }
}
