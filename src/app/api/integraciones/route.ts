import { ok, manejarError } from "@/lib/api";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { crearIntegracionGoogleRepo } from "@/infra/insforge/repos/integracion-google-repo";
import { crearIntegracionWhatsAppRepo } from "@/infra/insforge/repos/integracion-whatsapp-repo";
import { crearMiembroRepo } from "@/infra/insforge/repos/miembro-repo";
import { getActiveContextOrThrow } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = await getActiveContextOrThrow();
    const admin = getInsforgeAdmin();
    const waRepo = crearIntegracionWhatsAppRepo(admin);
    const whatsapp = await waRepo.buscarPorOrg(ctx.organizacion.id);

    const googleRepo = crearIntegracionGoogleRepo(admin);
    const integracionesGoogle = await googleRepo.listarPorOrg(ctx.organizacion.id);

    const miembroRepo = crearMiembroRepo(admin);
    const miembros = await miembroRepo.listar(ctx.organizacion.id);

    return ok({
      whatsapp: whatsapp
        ? { id: whatsapp.id, numero_whatsapp: whatsapp.numero_whatsapp, activo: whatsapp.activo }
        : null,
      google: integracionesGoogle.map((g) => ({
        id: g.id,
        miembro_id: g.miembro_id ?? null,
        email_google: g.email_google,
        calendario_id: g.calendario_id,
        activo: g.activo,
      })),
      miembros: miembros.map((m) => ({ id: m.id, nombre: m.nombre, color: m.color })),
      ics: {
        url: `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/calendario/${ctx.organizacion.slug}/${ctx.organizacion.ics_token}`,
      },
    });
  } catch (e) {
    return manejarError(e);
  }
}
