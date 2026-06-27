"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, CalendarCheck, Headset, Users } from "lucide-react";
import { apiFetch } from "@/components/shared/api";
import type { Lead } from "./types";
import { MetricCard } from "./components/metric-card";
import { LeadsTable } from "./components/leads-table";

export function LeadsView() {
  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ["leads"],
    queryFn: () => apiFetch<Lead[]>("/api/conversaciones/resumen"),
    refetchInterval: 10_000,
  });

  const m = useMemo(() => {
    const total = leads.length;
    const agendados = leads.filter((l) => l.resultado === "agendo").length;
    const derivados = leads.filter((l) => l.resultado === "derivado").length;
    const conversion = total > 0 ? Math.round((agendados / total) * 100) : 0;
    return { total, agendados, derivados, conversion };
  }, [leads]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Users} label="Conversaciones" valor={m.total} />
        <MetricCard icon={CalendarCheck} label="Agendaron" valor={m.agendados} sub={`${m.conversion}% de conversión`} />
        <MetricCard icon={Headset} label="Derivados" valor={m.derivados} />
        <MetricCard icon={MessageSquare} label="En curso" valor={m.total - m.agendados - m.derivados} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {isLoading && <p className="p-6 text-center text-sm text-slate-500">Cargando…</p>}
        {error && <p className="p-6 text-center text-sm text-red-600">{(error as Error).message}</p>}
        {!isLoading && leads.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">
            Todavía no hay conversaciones. Aparecerán acá cuando tus pacientes escriban por WhatsApp.
          </p>
        )}
        {leads.length > 0 && <LeadsTable leads={leads} />}
      </div>
    </div>
  );
}
