import { validateRequest } from "twilio";

export type TwilioMedia = {
  url: string;
  contentType: string;
};

export type TwilioInbound = {
  messageSid: string;
  from: string; // sin prefijo whatsapp:
  to: string; // sin prefijo whatsapp:
  body: string;
  numMedia: number;
  media: TwilioMedia[];
};

export function parseTwilioForm(form: URLSearchParams): TwilioInbound {
  const clean = (v: string | null) => (v ?? "").replace(/^whatsapp:/i, "").trim();
  const numMedia = Number(form.get("NumMedia") ?? "0");
  const media: TwilioMedia[] = [];
  for (let i = 0; i < numMedia; i++) {
    const url = form.get(`MediaUrl${i}`);
    const contentType = form.get(`MediaContentType${i}`);
    if (url) media.push({ url, contentType: contentType ?? "application/octet-stream" });
  }
  return {
    messageSid: form.get("MessageSid") ?? "",
    from: clean(form.get("From")),
    to: clean(form.get("To")),
    body: form.get("Body") ?? "",
    numMedia,
    media,
  };
}

/**
 * Descarga un media de Twilio (requiere basic auth con Account SID + Auth Token).
 * Devuelve el buffer crudo + content-type real. Límite de tamaño.
 */
const MAX_MEDIA_BYTES = 16 * 1024 * 1024; // 16 MB (WhatsApp tope)

export async function descargarMedia(
  mediaUrl: string,
  accountSid: string,
  authToken: string,
): Promise<{ tipo: string; buffer: Buffer } | null> {
  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const res = await fetch(mediaUrl, {
      headers: { Authorization: `Basic ${auth}` },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      console.error(`Descarga media Twilio falló: ${res.status}`);
      return null;
    }
    const tipo = res.headers.get("content-type") ?? "application/octet-stream";
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > MAX_MEDIA_BYTES) {
      console.warn("Media excede tamaño máximo, se ignora");
      return null;
    }
    return { tipo, buffer };
  } catch (err) {
    console.error("Error descargando media Twilio:", err);
    return null;
  }
}

/** Conveniencia: media → data URL base64 (para imágenes / vision). */
export async function descargarMediaComoDataUrl(
  mediaUrl: string,
  accountSid: string,
  authToken: string,
): Promise<{ tipo: string; dataUrl: string } | null> {
  const r = await descargarMedia(mediaUrl, accountSid, authToken);
  if (!r) return null;
  return { tipo: r.tipo, dataUrl: `data:${r.tipo};base64,${r.buffer.toString("base64")}` };
}

export function validarFirmaTwilio(
  authToken: string,
  signature: string | null,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!signature) return false;
  try {
    return validateRequest(authToken, signature, url, params);
  } catch {
    return false;
  }
}
