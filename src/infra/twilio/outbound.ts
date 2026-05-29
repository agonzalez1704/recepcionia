function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function twimlRespuesta(texto: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response><Message><Body>${escapeXml(texto)}</Body></Message></Response>`;
}

export function twimlVacio(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response></Response>`;
}
