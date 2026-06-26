import type { InsForgeClient } from "@insforge/sdk";

export type EstadoConversacion = "bot" | "humano";

export type Conversacion = {
  id: string;
  organizacion_id: string;
  numero_telefono: string;
  estado: EstadoConversacion;
  motivo: string | null;
  resultado: string;
  nombre_paciente: string | null;
  turno_id: string | null;
  derivado_en: string | null;
  actualizado_en: string;
};

export function crearConversacionRepo(client: InsForgeClient) {
  const tabla = () => client.database.from("conversaciones_whatsapp");

  async function buscar(orgId: string, numero: string): Promise<Conversacion | null> {
    const { data, error } = await tabla()
      .select("*")
      .eq("organizacion_id", orgId)
      .eq("numero_telefono", numero);
    if (error) throw error;
    return ((data as Conversacion[] | null) ?? [])[0] ?? null;
  }

  return {
    buscar,

    /** Estado actual (default 'bot' si no hay fila). */
    async estado(orgId: string, numero: string): Promise<EstadoConversacion> {
      const c = await buscar(orgId, numero);
      return c?.estado ?? "bot";
    },

    /** Pasa la conversación a 'humano' (pausa el bot). Upsert manual. */
    async marcarHumano(orgId: string, numero: string, motivo: string): Promise<void> {
      const ahora = new Date().toISOString();
      const existente = await buscar(orgId, numero);
      if (existente) {
        const { error } = await tabla()
          .update({ estado: "humano", motivo, derivado_en: ahora, actualizado_en: ahora })
          .eq("id", existente.id);
        if (error) throw error;
      } else {
        const { error } = await tabla().insert([
          { organizacion_id: orgId, numero_telefono: numero, estado: "humano", motivo, derivado_en: ahora },
        ]);
        if (error) throw error;
      }
    },

    /** Devuelve la conversación al bot. */
    async marcarBot(orgId: string, numero: string): Promise<void> {
      const ahora = new Date().toISOString();
      const existente = await buscar(orgId, numero);
      if (existente) {
        const { error } = await tabla()
          .update({ estado: "bot", motivo: null, actualizado_en: ahora })
          .eq("id", existente.id);
        if (error) throw error;
      }
    },

    /** Conversaciones en manos de un humano (para el dashboard). */
    async listarHumanos(orgId: string): Promise<Conversacion[]> {
      const { data, error } = await tabla()
        .select("*")
        .eq("organizacion_id", orgId)
        .eq("estado", "humano")
        .order("derivado_en", { ascending: false });
      if (error) throw error;
      return (data as Conversacion[] | null) ?? [];
    },

    /**
     * Registra el resultado de la conversación (lead). Upsert manual; no pisa un
     * resultado 'agendo' con uno más débil.
     */
    async marcarResultado(
      orgId: string,
      numero: string,
      resultado: "agendo" | "derivado" | "cerrado",
      extra?: { turnoId?: string; nombre?: string },
    ): Promise<void> {
      const ahora = new Date().toISOString();
      const existente = await buscar(orgId, numero);
      const campos: Record<string, unknown> = { resultado, actualizado_en: ahora };
      if (extra?.turnoId) campos.turno_id = extra.turnoId;
      if (extra?.nombre) campos.nombre_paciente = extra.nombre;
      if (existente) {
        // No degradar 'agendo' (lead convertido) a 'derivado'.
        if (existente.resultado === "agendo" && resultado !== "agendo") {
          if (!extra?.turnoId && !extra?.nombre) return;
          delete campos.resultado;
        }
        const { error } = await tabla().update(campos).eq("id", existente.id);
        if (error) throw error;
      } else {
        const { error } = await tabla().insert([
          { organizacion_id: orgId, numero_telefono: numero, ...campos },
        ]);
        if (error) throw error;
      }
    },

    /** Resumen agregado de todas las conversaciones (leads) de la org. */
    async resumen(orgId: string): Promise<ResumenConversacion[]> {
      const { data, error } = await client.database.rpc("conversaciones_resumen", { p_org_id: orgId });
      if (error) throw error;
      return (data as ResumenConversacion[] | null) ?? [];
    },
  };
}

export type ResumenConversacion = {
  numero_telefono: string;
  nombre_paciente: string | null;
  resultado: string;
  estado: EstadoConversacion;
  total_mensajes: number;
  mensajes_paciente: number;
  primer_contacto: string;
  ultimo_contacto: string;
  turno_id: string | null;
};

export type ConversacionRepo = ReturnType<typeof crearConversacionRepo>;
