import { parseISO } from "date-fns";
import { toZonedTime, format as formatTz } from "date-fns-tz";
import { GoogleIcon } from "@/components/shared/google-icon";
import type { Miembro } from "@/core/entities/miembro";

type Ocupado = { inicio: string; fin: string; fuente: "google"; miembro_id: string | null };

export function OcupadoCard({
  ocupado,
  miembro,
  zonaHoraria,
}: {
  ocupado: Ocupado;
  miembro?: Miembro;
  zonaHoraria: string;
}) {
  const inicio = toZonedTime(parseISO(ocupado.inicio), zonaHoraria);
  const fin = toZonedTime(parseISO(ocupado.fin), zonaHoraria);
  const horaInicio = formatTz(inicio, "HH:mm");
  const horaFin = formatTz(fin, "HH:mm");
  return (
    <div
      className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3"
      style={miembro ? { borderLeft: `4px solid ${miembro.color}` } : undefined}
      title="Bloque externo de Google Calendar"
    >
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <GoogleIcon className="h-4 w-4 shrink-0" />
        <span className="font-medium">{horaInicio} – {horaFin}</span>
        <span className="text-slate-500">Ocupado</span>
        {miembro && (
          <span
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-xs"
            style={{ color: miembro.color }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: miembro.color }} />
            {miembro.nombre}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-xs text-slate-500">Evento externo de Google Calendar</p>
    </div>
  );
}
