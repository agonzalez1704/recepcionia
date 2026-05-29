import { ActualizarTurnoSchema } from "@/core/entities/turno";
import { crearAgendarTurnoService } from "@/core/services/agendar-turno-service";
import { crearTurnoRepo } from "@/infra/insforge/repos/turno-repo";
import { resolverCalendarProvider } from "@/infra/google/calendar";
import { ok, manejarError } from "@/lib/api";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getActiveContextOrThrow();
    const body = await req.json().catch(() => null);
    const parsed = ActualizarTurnoSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, "datos_invalidos", "Datos inválidos", parsed.error.flatten());
    }
    const repo = crearTurnoRepo(getInsforgeAdmin());
    const service = crearAgendarTurnoService({
      turnoRepo: repo,
      resolverCalendar: (mid) => resolverCalendarProvider(ctx.organizacion.id, mid),
      organizacion: ctx.organizacion,
    });

    if (parsed.data.fecha_turno) {
      const turno = await service.reprogramar(id, new Date(parsed.data.fecha_turno).toISOString());
      const otros = { ...parsed.data };
      delete otros.fecha_turno;
      if (Object.keys(otros).length === 0) return ok(turno);
      const actualizado = await repo.actualizar(ctx.organizacion.id, id, otros);
      return ok(actualizado);
    }

    if (parsed.data.estado === "cancelado") {
      const turno = await service.cancelar(id);
      return ok(turno);
    }

    const turno = await repo.actualizar(ctx.organizacion.id, id, parsed.data);
    return ok(turno);
  } catch (e) {
    return manejarError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getActiveContextOrThrow();
    const repo = crearTurnoRepo(getInsforgeAdmin());
    const service = crearAgendarTurnoService({
      turnoRepo: repo,
      resolverCalendar: (mid) => resolverCalendarProvider(ctx.organizacion.id, mid),
      organizacion: ctx.organizacion,
    });
    const turno = await service.cancelar(id);
    return ok(turno);
  } catch (e) {
    return manejarError(e);
  }
}
