import type { InsForgeClient } from "@insforge/sdk";
import type { Miembro, CrearMiembro, ActualizarMiembro } from "@/core/entities/miembro";

export function crearMiembroRepo(client: InsForgeClient) {
  const tabla = () => client.database.from("miembros");

  return {
    async listar(orgId: string, soloActivos = false): Promise<Miembro[]> {
      let q = tabla().select("*").eq("organizacion_id", orgId).order("nombre", { ascending: true });
      if (soloActivos) q = q.eq("activo", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data as Miembro[] | null) ?? [];
    },
    async buscarPorId(orgId: string, id: string): Promise<Miembro | null> {
      const { data, error } = await tabla().select("*").eq("organizacion_id", orgId).eq("id", id);
      if (error) throw error;
      return (data as Miembro[] | null)?.[0] ?? null;
    },
    async crear(orgId: string, input: CrearMiembro): Promise<Miembro> {
      const { data, error } = await tabla()
        .insert([{ ...input, organizacion_id: orgId, activo: true }])
        .select("*");
      if (error) throw error;
      const row = (data as Miembro[] | null)?.[0];
      if (!row) throw new Error("No se pudo crear el miembro");
      return row;
    },
    async actualizar(orgId: string, id: string, patch: ActualizarMiembro): Promise<Miembro> {
      const { data, error } = await tabla()
        .update(patch)
        .eq("organizacion_id", orgId)
        .eq("id", id)
        .select("*");
      if (error) throw error;
      const row = (data as Miembro[] | null)?.[0];
      if (!row) throw new Error("Miembro no encontrado");
      return row;
    },
    async eliminar(orgId: string, id: string) {
      const { error } = await tabla().delete().eq("organizacion_id", orgId).eq("id", id);
      if (error) throw error;
    },
  };
}
