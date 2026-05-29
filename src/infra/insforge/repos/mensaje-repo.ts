import type { InsForgeClient } from "@insforge/sdk";
import type { MensajeRepo } from "@/core/ports/repos";
import type { Mensaje, Remitente } from "@/core/entities/mensaje";

export function crearMensajeRepo(client: InsForgeClient): MensajeRepo {
  const tabla = () => client.database.from("mensajes_whatsapp");

  return {
    async listar(orgId, opts = {}) {
      const limit = opts.limit ?? 50;
      let q = tabla()
        .select("*")
        .eq("organizacion_id", orgId)
        .order("recibido_en", { ascending: false })
        .limit(limit);
      if (opts.numero) q = q.eq("numero_telefono", opts.numero);
      if (opts.cursor) q = q.lt("recibido_en", opts.cursor);
      const { data, error } = await q;
      if (error) throw error;
      return (data as Mensaje[] | null) ?? [];
    },
    async ultimos(orgId, numero, limit) {
      const { data, error } = await tabla()
        .select("*")
        .eq("organizacion_id", orgId)
        .eq("numero_telefono", numero)
        .order("recibido_en", { ascending: false })
        .limit(limit);
      if (error) throw error;
      // Devolver en orden cronológico ascendente
      return ((data as Mensaje[] | null) ?? []).slice().reverse();
    },
    async crear(orgId, input: { numero_telefono: string; contenido: string; remitente: Remitente; tipo?: string; metadatos?: Record<string, unknown> }) {
      const { data, error } = await tabla()
        .insert([
          {
            organizacion_id: orgId,
            numero_telefono: input.numero_telefono,
            contenido: input.contenido,
            remitente: input.remitente,
            tipo: input.tipo ?? "texto",
            metadatos: input.metadatos ?? null,
          },
        ])
        .select("*");
      if (error) throw error;
      const row = (data as Mensaje[] | null)?.[0];
      if (!row) throw new Error("No se pudo guardar el mensaje");
      return row;
    },
    async contarEntrantesDesde(orgId, desdeIso) {
      const { count, error } = await tabla()
        .select("id", { count: "exact", head: true })
        .eq("organizacion_id", orgId)
        .eq("remitente", "paciente")
        .gte("recibido_en", desdeIso);
      if (error) throw error;
      return count ?? 0;
    },
  } satisfies MensajeRepo;
}
