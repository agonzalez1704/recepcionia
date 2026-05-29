import type { InsForgeClient } from "@insforge/sdk";
import { randomBytes } from "node:crypto";
import type { OrganizacionRepo } from "@/core/ports/repos";
import type { Organizacion, ActualizarOrganizacion } from "@/core/entities/organizacion";

export function crearOrganizacionRepo(client: InsForgeClient): OrganizacionRepo {
  const tabla = () => client.database.from("organizaciones");

  return {
    async buscarPorClerkId(clerkOrgId) {
      const { data, error } = await tabla().select("*").eq("clerk_org_id", clerkOrgId);
      if (error) throw error;
      return (data as Organizacion[] | null)?.[0] ?? null;
    },
    async buscarPorSlugYToken(slug, token) {
      const { data, error } = await tabla().select("*").eq("slug", slug).eq("ics_token", token);
      if (error) throw error;
      return (data as Organizacion[] | null)?.[0] ?? null;
    },
    async crear(input) {
      const { data, error } = await tabla()
        .insert([
          {
            clerk_org_id: input.clerk_org_id,
            nombre_clinica: input.nombre_clinica,
            slug: input.slug,
            zona_horaria: input.zona_horaria ?? "America/Mexico_City",
          },
        ])
        .select("*");
      if (error) throw error;
      const row = (data as Organizacion[] | null)?.[0];
      if (!row) throw new Error("No se pudo crear la organización");
      return row;
    },
    async actualizar(id, patch: ActualizarOrganizacion) {
      const { data, error } = await tabla().update(patch).eq("id", id).select("*");
      if (error) throw error;
      const row = (data as Organizacion[] | null)?.[0];
      if (!row) throw new Error("Organización no encontrada");
      return row;
    },
    async regenerarIcsToken(id) {
      const token = randomBytes(24).toString("base64url");
      const { error } = await tabla().update({ ics_token: token }).eq("id", id);
      if (error) throw error;
      return token;
    },
  };
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "clinica";
}
