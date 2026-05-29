import { crearMiembroRepo } from "@/infra/insforge/repos/miembro-repo";
import { crearOrganizacionRepo } from "@/infra/insforge/repos/organizacion-repo";
import { crearTurnoRepo } from "@/infra/insforge/repos/turno-repo";
import { generarFeedICS } from "@/infra/ics/feed";
import { getInsforgeAdmin } from "@/lib/insforge-admin";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ orgSlug: string; token: string }> }) {
  const { orgSlug, token } = await params;

  const admin = getInsforgeAdmin();
  const orgRepo = crearOrganizacionRepo(admin);
  const org = await orgRepo.buscarPorSlugYToken(orgSlug, token);
  if (!org) {
    return new Response("Calendario no encontrado o token inválido", { status: 404 });
  }

  const turnoRepo = crearTurnoRepo(admin);
  const miembroRepo = crearMiembroRepo(admin);

  // Ventana: 1 mes atrás → 12 meses adelante
  const ahora = new Date();
  const desde = new Date(ahora.getTime() - 30 * 24 * 3600_000).toISOString();
  const hasta = new Date(ahora.getTime() + 365 * 24 * 3600_000).toISOString();

  const [turnos, miembros] = await Promise.all([
    turnoRepo.listar(org.id, { desde, hasta }),
    miembroRepo.listar(org.id),
  ]);

  const ics = generarFeedICS({ organizacion: org, turnos, miembros });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${org.slug}.ics"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
