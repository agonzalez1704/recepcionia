import type { InsForgeClient } from "@insforge/sdk";
import type { IntegracionWhatsApp } from "@/core/entities/integraciones";

export type IntegracionWhatsAppConOrg = IntegracionWhatsApp & {
  organizaciones: { id: string; clerk_org_id: string; nombre_clinica: string; zona_horaria: string };
};

export function crearIntegracionWhatsAppRepo(client: InsForgeClient) {
  const tabla = () => client.database.from("integraciones_whatsapp");

  return {
    async buscarPorNumero(numero: string): Promise<IntegracionWhatsApp | null> {
      const { data, error } = await tabla()
        .select("*")
        .eq("numero_whatsapp", numero)
        .eq("activo", true);
      if (error) throw error;
      return (data as IntegracionWhatsApp[] | null)?.[0] ?? null;
    },
    async buscarPorOrg(orgId: string): Promise<IntegracionWhatsApp | null> {
      const { data, error } = await tabla().select("*").eq("organizacion_id", orgId);
      if (error) throw error;
      return (data as IntegracionWhatsApp[] | null)?.[0] ?? null;
    },
    async upsert(orgId: string, input: {
      numero_whatsapp: string;
      twilio_account_sid: string;
      twilio_auth_token: string;
      activo?: boolean;
    }) {
      const existing = await this.buscarPorOrg(orgId);
      if (existing) {
        const { data, error } = await tabla()
          .update({ ...input, activo: input.activo ?? true })
          .eq("id", existing.id)
          .select("*");
        if (error) throw error;
        return (data as IntegracionWhatsApp[])[0];
      }
      const { data, error } = await tabla()
        .insert([{ ...input, organizacion_id: orgId, activo: input.activo ?? true }])
        .select("*");
      if (error) throw error;
      return (data as IntegracionWhatsApp[])[0];
    },
    async eliminar(orgId: string) {
      const { error } = await tabla().delete().eq("organizacion_id", orgId);
      if (error) throw error;
    },
  };
}
