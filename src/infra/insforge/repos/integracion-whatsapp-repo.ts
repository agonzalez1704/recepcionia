import type { InsForgeClient } from "@insforge/sdk";
import type { IntegracionWhatsApp } from "@/core/entities/integraciones";

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
    async buscarPorPhoneNumberId(phoneNumberId: string): Promise<IntegracionWhatsApp | null> {
      const { data, error } = await tabla().select("*").eq("phone_number_id", phoneNumberId);
      if (error) throw error;
      return (data as IntegracionWhatsApp[] | null)?.[0] ?? null;
    },
    async buscarPorOrg(orgId: string): Promise<IntegracionWhatsApp | null> {
      const { data, error } = await tabla().select("*").eq("organizacion_id", orgId);
      if (error) throw error;
      return (data as IntegracionWhatsApp[] | null)?.[0] ?? null;
    },
    /** Crea/actualiza la fila con datos del modelo ISV (sender). */
    async guardar(
      orgId: string,
      input: Partial<{
        numero_whatsapp: string;
        sender_sid: string;
        telefono_sid: string;
        pais: string;
        estado_sender: string;
        kapso_customer_id: string;
        phone_number_id: string;
        business_account_id: string;
        display_phone_number: string;
        connection_type: string;
        webhook_secret: string;
        activo: boolean;
      }>,
    ): Promise<IntegracionWhatsApp> {
      const existing = await this.buscarPorOrg(orgId);
      if (existing) {
        const { data, error } = await tabla().update(input).eq("id", existing.id).select("*");
        if (error) throw error;
        return (data as IntegracionWhatsApp[])[0];
      }
      const { data, error } = await tabla()
        .insert([{ ...input, organizacion_id: orgId }])
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
