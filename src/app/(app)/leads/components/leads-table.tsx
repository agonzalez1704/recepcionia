import Link from "next/link";
import { formatearChat } from "@/lib/fechas";
import { cn } from "@/lib/utils";
import type { Lead } from "../types";

const RESULTADO: Record<string, { label: string; clase: string }> = {
  agendo: { label: "Agendó", clase: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  derivado: { label: "Derivado", clase: "bg-amber-50 text-amber-700 border-amber-200" },
  cerrado: { label: "Cerrado", clase: "bg-slate-100 text-slate-600 border-slate-200" },
  en_curso: { label: "En curso", clase: "bg-brand-50 text-brand-700 border-brand-200" },
};

export function LeadsTable({ leads }: { leads: Lead[] }) {
  return (
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
  );
}
