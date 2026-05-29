import type { InsForgeClient } from "@insforge/sdk";
import type { IntegracionGoogle } from "@/core/entities/integraciones";

export type UpsertGoogleInput = {
  miembro_id: string | null;
  usuario_clerk_id: string;
  email_google: string;
  access_token: string; // ya cifrado
  refresh_token: string; // ya cifrado
  calendario_id: string;
  expira_en: string;
};

export function crearIntegracionGoogleRepo(client: InsForgeClient) {
  const tabla = () => client.database.from("integraciones_google");

  return {
    async listarPorOrg(orgId: string): Promise<IntegracionGoogle[]> {
      const { data, error } = await tabla()
        .select("*")
        .eq("organizacion_id", orgId)
        .order("creado_en", { ascending: true });
      if (error) throw error;
      return (data as IntegracionGoogle[] | null) ?? [];
    },
    async buscarPorOrgYMiembro(orgId: string, miembroId: string | null): Promise<IntegracionGoogle | null> {
      let q = tabla().select("*").eq("organizacion_id", orgId);
      q = miembroId ? q.eq("miembro_id", miembroId) : q.is("miembro_id", null);
      const { data, error } = await q;
      if (error) throw error;
      return (data as IntegracionGoogle[] | null)?.[0] ?? null;
    },
    async upsert(orgId: string, input: UpsertGoogleInput): Promise<IntegracionGoogle> {
      const existente = await this.buscarPorOrgYMiembro(orgId, input.miembro_id);
      if (existente) {
        const { data, error } = await tabla()
          .update({ ...input, activo: true })
          .eq("id", existente.id)
          .select("*");
        if (error) throw error;
        return (data as IntegracionGoogle[])[0];
      }
      const { data, error } = await tabla()
        .insert([{ ...input, organizacion_id: orgId, activo: true }])
        .select("*");
      if (error) throw error;
      return (data as IntegracionGoogle[])[0];
    },
    async actualizarTokens(
      id: string,
      input: { access_token: string; expira_en: string; refresh_token?: string },
    ): Promise<void> {
      const { error } = await tabla().update(input).eq("id", id);
      if (error) throw error;
    },
    async eliminar(id: string): Promise<void> {
      const { error } = await tabla().delete().eq("id", id);
      if (error) throw error;
    },
  };
}
