"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, CalendarCheck, Headset, Users } from "lucide-react";
import { apiFetch } from "@/components/shared/api";
import { formatearChat } from "@/lib/fechas";
import { cn } from "@/lib/utils";

type Lead = {
  numero_telefono: string;
  nombre_paciente: string | null;
  resultado: string;
  estado: string;
  total_mensajes: number;
  mensajes_paciente: number;
  primer_contacto: string;
  ultimo_contacto: string;
  turno_id: string | null;
};

const RESULTADO: Record<string, { label: string; clase: string }> = {
  agendo: { label: "Agendó", clase: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  derivado: { label: "Derivado", clase: "bg-amber-50 text-amber-700 border-amber-200" },
  cerrado: { label: "Cerrado", clase: "bg-slate-100 text-slate-600 border-slate-200" },
  en_curso: { label: "En curso", clase: "bg-brand-50 text-brand-700 border-brand-200" },
};

function Metric({ icon: Icon, label, valor, sub }: { icon: typeof Users; label: string; valor: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        <Icon className="h-4 w-4 text-brand-600" /> {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-brand-900">{valor}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

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
        <Metric icon={Users} label="Conversaciones" valor={m.total} />
        <Metric icon={CalendarCheck} label="Agendaron" valor={m.agendados} sub={`${m.conversion}% de conversión`} />
        <Metric icon={Headset} label="Derivados" valor={m.derivados} />
        <Metric icon={MessageSquare} label="En curso" valor={m.total - m.agendados - m.derivados} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {isLoading && <p className="p-6 text-center text-sm text-slate-500">Cargando…</p>}
        {error && <p className="p-6 text-center text-sm text-red-600">{(error as Error).message}</p>}
        {!isLoading && leads.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">
            Todavía no hay conversaciones. Aparecerán acá cuando tus pacientes escriban por WhatsApp.
          </p>
        )}
        {leads.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Paciente</th>
                <th className="px-4 py-3 font-medium">Resultado</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Mensajes</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Última actividad</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leads.map((l) => {
                const r = RESULTADO[l.resultado] ?? RESULTADO.en_curso;
                return (
                  <tr key={l.numero_telefono} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{l.nombre_paciente ?? "—"}</p>
                      <p className="text-xs text-slate-500">{l.numero_telefono}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium", r.clase)}>
                        {r.label}
                      </span>
                      {l.estado === "humano" && (
                        <span className="ml-1.5 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                          con el equipo
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                      {l.mensajes_paciente} / {l.total_mensajes}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{formatearChat(l.ultimo_contacto)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/mensajes?numero=${encodeURIComponent(l.numero_telefono)}`}
                        className="text-xs font-medium text-brand-700 hover:underline"
                      >
                        Ver chat
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
