import { z } from "zod";
import { ok, manejarError } from "@/lib/api";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { crearTurnoRepo } from "@/infra/insforge/repos/turno-repo";
import { crearMiembroRepo } from "@/infra/insforge/repos/miembro-repo";
import { crearAgendarTurnoService, MiembroRequeridoError, TurnoSolapadoError } from "@/core/services/agendar-turno-service";
import { EstadoTurnoSchema } from "@/core/entities/turno";
import { resolverCalendarProvider } from "@/infra/google/calendar";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const CrearInput = z.object({
  nombre_paciente: z.string().min(1),
  numero_telefono: z.string().min(1),
  fecha_turno: z.string(),
  servicio: z.string().optional(),
  notas: z.string().optional().nullable(),
  miembro_id: z.string().uuid().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const ctx = await getActiveContextOrThrow();
    const url = new URL(req.url);
    const desde = url.searchParams.get("desde") ?? undefined;
    const hasta = url.searchParams.get("hasta") ?? undefined;
    const estadoRaw = url.searchParams.get("estado");
    const estado = estadoRaw ? EstadoTurnoSchema.parse(estadoRaw) : undefined;
    const miembroId = url.searchParams.get("miembro_id") ?? undefined;
    const repo = crearTurnoRepo(getInsforgeAdmin());
    const turnos = await repo.listar(ctx.organizacion.id, { desde, hasta, estado, miembroId });
    return ok(turnos);
  } catch (e) {
    return manejarError(e);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getActiveContextOrThrow();
    const body = await req.json().catch(() => null);
    const parsed = CrearInput.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, "datos_invalidos", "Datos inválidos", parsed.error.flatten());
    }
    const admin = getInsforgeAdmin();
    const repo = crearTurnoRepo(admin);
    const miembros = await crearMiembroRepo(admin).listar(ctx.organizacion.id, true);
    const service = crearAgendarTurnoService({
      turnoRepo: repo,
      resolverCalendar: (mid) => resolverCalendarProvider(ctx.organizacion.id, mid),
      organizacion: ctx.organizacion,
      miembros,
    });
    const turno = await service.agendar({
      ...parsed.data,
      notas: parsed.data.notas ?? undefined,
      miembro_id: parsed.data.miembro_id ?? null,
      fecha_turno: new Date(parsed.data.fecha_turno).toISOString(),
    });
    return ok(turno, { status: 201 });
  } catch (e) {
    if (e instanceof MiembroRequeridoError) {
      return manejarError(new HttpError(400, "miembro_requerido", "Hay que asignar un profesional a la cita"));
    }
    if (e instanceof TurnoSolapadoError) {
      return manejarError(new HttpError(409, "horario_ocupado", "Ese horario ya está ocupado"));
    }
    return manejarError(e);
  }
}
