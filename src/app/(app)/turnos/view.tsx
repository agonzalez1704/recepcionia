"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { Calendar as CalIcon, List, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "@/components/shared/api";
import { cn } from "@/lib/utils";
import type { Turno } from "@/core/entities/turno";
import type { Miembro } from "@/core/entities/miembro";
import { OcupadoCard } from "./components/ocupado-card";
import { TurnoCard } from "./components/turno-card";

type Ocupado = { inicio: string; fin: string; fuente: "google"; miembro_id: string | null };

type Vista = "calendario" | "lista";

export function TurnosView({ zonaHoraria }: { zonaHoraria: string }) {
  const [vista, setVista] = useState<Vista>("calendario");
  const [mesActual, setMesActual] = useState(() => startOfMonth(new Date()));
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date>(new Date());
  const [miembroFiltro, setMiembroFiltro] = useState<string | null>(null);
  const qc = useQueryClient();

  const desde = startOfMonth(mesActual).toISOString();
  const hasta = endOfMonth(addMonths(mesActual, 1)).toISOString();

  const { data: turnos = [], isLoading } = useQuery({
    queryKey: ["turnos", desde, hasta],
    queryFn: () => apiFetch<Turno[]>(`/api/turnos?desde=${desde}&hasta=${hasta}`),
    refetchInterval: 5000,
  });

  const { data: miembros = [] } = useQuery({
    queryKey: ["equipo"],
    queryFn: () => apiFetch<Miembro[]>("/api/equipo"),
  });

  const ocupadosQs =
    miembroFiltro && miembroFiltro !== "__sin__"
      ? `&miembro_id=${miembroFiltro}`
      : "";
  const { data: ocupados = [] } = useQuery({
    queryKey: ["eventos-externos", desde, hasta, miembroFiltro ?? "all"],
    queryFn: () =>
      apiFetch<Ocupado[]>(`/api/eventos-externos?desde=${desde}&hasta=${hasta}${ocupadosQs}`),
    refetchInterval: 30_000,
  });

  const ocupadosFiltrados = useMemo(() => {
    if (miembroFiltro === "__sin__") return ocupados.filter((o) => o.miembro_id === null);
    if (miembroFiltro) return ocupados.filter((o) => o.miembro_id === miembroFiltro || o.miembro_id === null);
    return ocupados;
  }, [ocupados, miembroFiltro]);

  const ocupadosPorDia = useMemo(() => {
    const map = new Map<string, Ocupado[]>();
    for (const o of ocupadosFiltrados) {
      const local = toZonedTime(new Date(o.inicio), zonaHoraria);
      const key = format(local, "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(o);
      map.set(key, arr);
    }
    return map;
  }, [ocupadosFiltrados, zonaHoraria]);

  const turnosFiltrados = useMemo(() => {
    if (!miembroFiltro) return turnos;
    if (miembroFiltro === "__sin__") return turnos.filter((t) => !t.miembro_id);
    return turnos.filter((t) => t.miembro_id === miembroFiltro);
  }, [turnos, miembroFiltro]);

  const turnosPorDia = useMemo(() => {
    const map = new Map<string, Turno[]>();
    for (const t of turnosFiltrados) {
      if (t.estado === "cancelado") continue;
      const local = toZonedTime(new Date(t.fecha_turno), zonaHoraria);
      const key = format(local, "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [turnosFiltrados, zonaHoraria]);

  const diasMes = eachDayOfInterval({ start: startOfMonth(mesActual), end: endOfMonth(mesActual) });
  const turnosDelDia = useMemo(() => {
    const key = format(diaSeleccionado, "yyyy-MM-dd");
    return (turnosPorDia.get(key) ?? []).slice().sort((a, b) => a.fecha_turno.localeCompare(b.fecha_turno));
  }, [turnosPorDia, diaSeleccionado]);

  const ocupadosDelDia = useMemo(() => {
    const key = format(diaSeleccionado, "yyyy-MM-dd");
    return (ocupadosPorDia.get(key) ?? []).slice().sort((a, b) => a.inicio.localeCompare(b.inicio));
  }, [ocupadosPorDia, diaSeleccionado]);

  // Merge para mostrar mezclados en panel día
  const itemsDelDia = useMemo(() => {
    const turnoItems = turnosDelDia.map((t) => ({ tipo: "turno" as const, hora: t.fecha_turno, turno: t }));
    const ocupadoItems = ocupadosDelDia.map((o) => ({ tipo: "ocupado" as const, hora: o.inicio, ocupado: o }));
    return [...turnoItems, ...ocupadoItems].sort((a, b) => a.hora.localeCompare(b.hora));
  }, [turnosDelDia, ocupadosDelDia]);

  const cancelar = useMutation({
    mutationFn: (id: string) => apiFetch<Turno>(`/api/turnos/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Turno cancelado");
      void qc.invalidateQueries({ queryKey: ["turnos"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const confirmar = useMutation({
    mutationFn: (id: string) =>
      apiFetch<Turno>(`/api/turnos/${id}`, { method: "PATCH", body: JSON.stringify({ estado: "confirmado" }) }),
    onSuccess: () => {
      toast.success("Turno confirmado");
      void qc.invalidateQueries({ queryKey: ["turnos"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const miembroPorId = useMemo(() => new Map(miembros.map((m) => [m.id, m])), [miembros]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-sm">
          <button
            onClick={() => setVista("calendario")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5",
              vista === "calendario" ? "bg-brand-900 text-white" : "text-slate-600",
            )}
          >
            <CalIcon className="h-4 w-4" /> Calendario
          </button>
          <button
            onClick={() => setVista("lista")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5",
              vista === "lista" ? "bg-brand-900 text-white" : "text-slate-600",
            )}
          >
            <List className="h-4 w-4" /> Lista
          </button>
        </div>

        {miembros.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setMiembroFiltro(null)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                !miembroFiltro
                  ? "border-brand-600 bg-brand-50 text-brand-900"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50",
              )}
            >
              Todos
            </button>
            {miembros.map((m) => {
              const on = miembroFiltro === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMiembroFiltro(m.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                    on ? "border-brand-600 bg-brand-50 text-brand-900" : "border-slate-300 text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
                  {m.nombre}
                </button>
              );
            })}
            <button
              onClick={() => setMiembroFiltro("__sin__")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                miembroFiltro === "__sin__"
                  ? "border-brand-600 bg-brand-50 text-brand-900"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50",
              )}
            >
              Sin asignar
            </button>
          </div>
        )}
      </div>

      {vista === "calendario" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <button onClick={() => setMesActual((m) => subMonths(m, 1))} className="rounded-lg p-1 hover:bg-slate-100">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold capitalize">
                {format(mesActual, "LLLL yyyy", { locale: es })}
              </h2>
              <button onClick={() => setMesActual((m) => addMonths(m, 1))} className="rounded-lg p-1 hover:bg-slate-100">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <div key={i} className="py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {Array.from({ length: (diasMes[0].getDay() + 6) % 7 }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {diasMes.map((d) => {
                const key = format(d, "yyyy-MM-dd");
                const cant = (turnosPorDia.get(key)?.length ?? 0) + (ocupadosPorDia.get(key)?.length ?? 0);
                const seleccionado = isSameDay(d, diaSeleccionado);
                return (
                  <button
                    key={key}
                    onClick={() => setDiaSeleccionado(d)}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition",
                      seleccionado
                        ? "bg-brand-900 text-white"
                        : cant > 0
                          ? "bg-brand-50 text-brand-900 hover:bg-brand-100"
                          : "hover:bg-slate-50",
                    )}
                  >
                    <span>{format(d, "d")}</span>
                    {cant > 0 && (
                      <span className={cn("text-[10px]", seleccionado ? "text-white/80" : "text-brand-700")}>
                        {cant}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 font-semibold capitalize">
              {format(diaSeleccionado, "EEEE d 'de' MMMM", { locale: es })}
            </h3>
            {itemsDelDia.length === 0 ? (
              <p className="text-sm text-slate-500">Sin turnos este día.</p>
            ) : (
              <ul className="space-y-2">
                {itemsDelDia.map((item, i) => {
                  if (item.tipo === "turno") {
                    const t = item.turno;
                    return (
                      <TurnoCard
                        key={t.id}
                        turno={t}
                        miembro={t.miembro_id ? miembroPorId.get(t.miembro_id) : undefined}
                        zonaHoraria={zonaHoraria}
                        onCancelar={() => cancelar.mutate(t.id)}
                        onConfirmar={() => confirmar.mutate(t.id)}
                      />
                    );
                  }
                  return (
                    <OcupadoCard
                      key={`ocup-${i}`}
                      ocupado={item.ocupado}
                      miembro={item.ocupado.miembro_id ? miembroPorId.get(item.ocupado.miembro_id) : undefined}
                      zonaHoraria={zonaHoraria}
                    />
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white">
          {isLoading && <p className="p-6 text-center text-sm text-slate-500">Cargando…</p>}
          {!isLoading && turnosFiltrados.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-500">Sin turnos.</p>
          )}
          <ul className="divide-y divide-slate-100">
            {turnosFiltrados.map((t) => (
              <li key={t.id} className="p-4">
                <TurnoCard
                  turno={t}
                  miembro={t.miembro_id ? miembroPorId.get(t.miembro_id) : undefined}
                  zonaHoraria={zonaHoraria}
                  onCancelar={() => cancelar.mutate(t.id)}
                  onConfirmar={() => confirmar.mutate(t.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
