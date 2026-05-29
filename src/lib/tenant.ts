import { auth, clerkClient } from "@clerk/nextjs/server";
import { getInsforgeAdmin } from "./insforge-admin";
import { crearOrganizacionRepo, slugify } from "@/infra/insforge/repos/organizacion-repo";
import type { Organizacion } from "@/core/entities/organizacion";

export type ActiveContext = {
  userId: string;
  clerkOrgId: string;
  orgRole: string | null | undefined;
  organizacion: Organizacion;
};

/**
 * Devuelve userId + organización activa. Lanza si no hay sesión o no hay org.
 * Lazy-provisioning: si la org existe en Clerk pero no en InsForge (webhook
 * todavía no llegó, o entorno dev sin webhook), la crea on-demand.
 */
export async function getActiveContextOrThrow(): Promise<ActiveContext> {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) throw new HttpError(401, "no_autenticado", "Sesión requerida");
  if (!orgId) throw new HttpError(403, "sin_organizacion", "Necesitás seleccionar una organización");

  const admin = getInsforgeAdmin();
  const repo = crearOrganizacionRepo(admin);

  let org = await repo.buscarPorClerkId(orgId);
  if (!org) {
    const clerk = await clerkClient();
    const clerkOrg = await clerk.organizations.getOrganization({ organizationId: orgId });
    org = await repo.crear({
      clerk_org_id: orgId,
      nombre_clinica: clerkOrg.name,
      slug: clerkOrg.slug ?? slugify(clerkOrg.name + "-" + orgId.slice(-6)),
    });
  }

  return { userId, clerkOrgId: orgId, orgRole, organizacion: org };
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public codigo: string,
    mensaje: string,
    public detalles?: unknown,
  ) {
    super(mensaje);
  }
}
