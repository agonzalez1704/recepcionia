"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { toZonedTime, format as formatTz } from "date-fns-tz";
import { es } from "date-fns/locale";
import { Calendar as CalIcon } from "lucide-react";
import { apiFetch } from "@/components/shared/api";
import { EstadoBadge } from "@/components/shared/estado-badge";
import type { Turno } from "@/core/entities/turno";
import type { Miembro } from "@/core/entities/miembro";

export function ProximosTurnos({ zonaHoraria }: { zonaHoraria: string }) {
  // Desde el comienzo del día de hoy (no desde "ahora") para que los turnos de
  // hoy más temprano sigan visibles. Hasta 14 días adelante.
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const en14dias = new Date(inicioHoy.getTime() + 14 * 24 * 3600_000);

  const { data: turnos = [], isLoading } = useQuery({
    queryKey: ["proximos-turnos"],
    queryFn: () =>
      apiFetch<Turno[]>(
        `/api/turnos?desde=${inicioHoy.toISOString()}&hasta=${en14dias.toISOString()}`,
      ),
    refetchInterval: 10_000,
  });

  const { data: miembros = [] } = useQuery({
    queryKey: ["equipo"],
    queryFn: () => apiFetch<Miembro[]>("/api/equipo"),
  });

  const activos = turnos.filter((t) => t.estado !== "cancelado");

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Cargando…
      </div>
    );
  }

  if (activos.length === 0) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6">
        <CalIcon className="h-8 w-8 text-slate-400" />
        <div>
          <p className="font-medium text-slate-700">Sin turnos próximos</p>
          <p className="text-sm text-slate-500">
            Cuando la IA agende un turno aparecerá acá.{" "}
            <Link href="/turnos" className="text-brand-700 hover:underline">
              Ver calendario completo
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <ul className="divide-y divide-slate-100">
        {activos.slice(0, 6).map((t) => {
          const local = toZonedTime(parseISO(t.fecha_turno), zonaHoraria);
          const hora = formatTz(local, "HH:mm");
          const fecha = format(local, "EEE d MMM", { locale: es });
          const miembro = miembros.find((m) => m.id === t.miembro_id);
          return (
            <li key={t.id} className="flex items-center gap-4 p-4">
              <div className="flex w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 px-3 py-2 text-brand-900">
                <span className="text-xs font-medium uppercase">{fecha.split(" ")[0]}</span>
                <span className="text-lg font-bold leading-tight">{fecha.split(" ")[1]}</span>
                <span className="text-xs">{fecha.split(" ")[2]}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{t.nombre_paciente}</span>
                  <EstadoBadge estado={t.estado} />
                </div>
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{hora}</span> · {t.servicio}
                  {miembro && (
                    <>
                      {" "}· con{" "}
                      <span style={{ color: miembro.color }} className="font-medium">
                        {miembro.nombre}
                      </span>
                    </>
                  )}
                </p>
                <p className="text-xs text-slate-500">{t.numero_telefono}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-slate-100 p-3 text-center">
        <Link href="/turnos" className="text-sm font-medium text-brand-700 hover:underline">
          Ver todos los turnos →
        </Link>
      </div>
    </div>
  );
}
