import type { InsForgeClient } from "@insforge/sdk";
import type { TurnoRepo } from "@/core/ports/repos";
import type { Turno, CrearTurno, ActualizarTurno, EstadoTurno } from "@/core/entities/turno";

export function crearTurnoRepo(client: InsForgeClient): TurnoRepo {
  const tabla = () => client.database.from("turnos");

  return {
    async listar(orgId, filtros = {}) {
      let q = tabla().select("*").eq("organizacion_id", orgId).order("fecha_turno", { ascending: true });
      if (filtros.desde) q = q.gte("fecha_turno", filtros.desde);
      if (filtros.hasta) q = q.lte("fecha_turno", filtros.hasta);
      if (filtros.estado) q = q.eq("estado", filtros.estado);
      if (filtros.miembroId) q = q.eq("miembro_id", filtros.miembroId);
      const { data, error } = await q;
      if (error) throw error;
      return (data as Turno[] | null) ?? [];
    },
    async listarPorTelefono(orgId, numero) {
      const { data, error } = await tabla()
        .select("*")
        .eq("organizacion_id", orgId)
        .eq("numero_telefono", numero)
        .neq("estado", "cancelado")
        .order("fecha_turno", { ascending: true });
      if (error) throw error;
      return (data as Turno[] | null) ?? [];
    },
    async buscarPorId(orgId, id) {
      const { data, error } = await tabla()
        .select("*")
        .eq("organizacion_id", orgId)
        .eq("id", id);
      if (error) throw error;
      return (data as Turno[] | null)?.[0] ?? null;
    },
    async crear(orgId, input: CrearTurno) {
      const { data, error } = await tabla()
        .insert([{ ...input, organizacion_id: orgId }])
        .select("*");
      if (error) throw error;
      const row = (data as Turno[] | null)?.[0];
      if (!row) throw new Error("No se pudo crear el turno");
      return row;
    },
    async actualizar(orgId, id, patch: ActualizarTurno) {
      const { data, error } = await tabla()
        .update(patch)
        .eq("organizacion_id", orgId)
        .eq("id", id)
        .select("*");
      if (error) throw error;
      const row = (data as Turno[] | null)?.[0];
      if (!row) throw new Error("Turno no encontrado");
      return row;
    },
    async haySolapamiento(orgId, fecha, duracionMin, opts = {}) {
      // Trae turnos cuya ventana se solape con [fecha, fecha+duracionMin]
      const inicio = new Date(fecha);
      const fin = new Date(inicio.getTime() + duracionMin * 60_000);
      const desde = new Date(inicio.getTime() - 24 * 60 * 60_000).toISOString();
      const hasta = new Date(fin.getTime() + 24 * 60 * 60_000).toISOString();

      let q = tabla()
        .select("id, miembro_id, fecha_turno, duracion_min, estado")
        .eq("organizacion_id", orgId)
        .neq("estado", "cancelado")
        .gte("fecha_turno", desde)
        .lte("fecha_turno", hasta);

      // Si especifican miembro → solo turnos de ese miembro (otros miembros pueden tener turno mismo horario)
      if (opts.miembroId) q = q.eq("miembro_id", opts.miembroId);
      // Si no especifican → solo turnos sin miembro (recurso compartido)
      // En multi-miembro, agendar sin miembro_id solo solapa con otros sin miembro_id.

      const { data, error } = await q;
      if (error) throw error;
      const rows = (data as Pick<Turno, "id" | "miembro_id" | "fecha_turno" | "duracion_min" | "estado">[] | null) ?? [];
      return rows.some((r) => {
        if (opts.excluirId && r.id === opts.excluirId) return false;
        if (!opts.miembroId && r.miembro_id) return false; // turnos con miembro no bloquean recursos sin miembro
        const a = new Date(r.fecha_turno).getTime();
        const b = a + r.duracion_min * 60_000;
        return a < fin.getTime() && inicio.getTime() < b;
      });
    },
  } satisfies TurnoRepo;
}

export type ListarFiltros = { desde?: string; hasta?: string; estado?: EstadoTurno; miembroId?: string | null };
