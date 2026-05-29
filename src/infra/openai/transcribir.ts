import OpenAI, { toFile } from "openai";
import { getServerEnv } from "@/lib/env";

const MIME_EXT: Record<string, string> = {
  "audio/ogg": "ogg",
  "audio/opus": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "mp4",
  "audio/m4a": "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "webm",
  "audio/amr": "amr",
};

function extDesdeMime(mime: string): string {
  const base = mime.split(";")[0].trim().toLowerCase();
  return MIME_EXT[base] ?? "ogg";
}

/**
 * Transcribe audio a texto con Whisper. Devuelve null si falla o no hay API key.
 * WhatsApp manda notas de voz como audio/ogg (opus), soportado por Whisper.
 */
export async function transcribirAudio(buffer: Buffer, mime: string): Promise<string | null> {
  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) return null;
  try {
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const ext = extDesdeMime(mime);
    const file = await toFile(buffer, `nota-voz.${ext}`, { type: mime.split(";")[0] });
    const res = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "es",
    });
    return res.text?.trim() || null;
  } catch (err) {
    console.error("Transcripción de audio falló:", err);
    return null;
  }
}
