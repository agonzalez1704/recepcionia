/**
 * HTML simple → texto plano. Saca scripts/styles, decodifica entidades comunes,
 * colapsa whitespace. No es perfecto pero alcanza para alimentar a un LLM.
 */
export function htmlATexto(html: string): string {
  let s = html;
  // Remover script/style/noscript completos
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  // Comentarios HTML
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  // Bloque a saltos de línea para preservar estructura
  s = s.replace(/<\/(p|div|li|h[1-6]|tr|br|section|article|header|footer)>/gi, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  // Resto de tags
  s = s.replace(/<[^>]+>/g, " ");
  // Entidades comunes
  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&ntilde;/gi, "ñ")
    .replace(/&Aacute;/gi, "Á")
    .replace(/&Eacute;/gi, "É")
    .replace(/&Iacute;/gi, "Í")
    .replace(/&Oacute;/gi, "Ó")
    .replace(/&Uacute;/gi, "Ú")
    .replace(/&Ntilde;/gi, "Ñ");
  // Normalizar whitespace
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/\n[ \t]+/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}
