import { format, parseISO } from "date-fns";
import { toZonedTime, format as formatTz } from "date-fns-tz";
import { es } from "date-fns/locale";
import { X, Check } from "lucide-react";
import { EstadoBadge } from "@/components/shared/estado-badge";
import type { Turno } from "@/core/entities/turno";
import type { Miembro } from "@/core/entities/miembro";

export function TurnoCard({
  turno,
  miembro,
  zonaHoraria,
  onCancelar,
  onConfirmar,
}: {
  turno: Turno;
  miembro?: Miembro;
  zonaHoraria: string;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  const local = toZonedTime(parseISO(turno.fecha_turno), zonaHoraria);
  const hora = formatTz(local, "HH:mm");
  const fecha = format(local, "d 'de' MMMM yyyy", { locale: es });

  return (
    <div
      className="rounded-xl border border-slate-100 p-3"
      style={miembro ? { borderLeft: `4px solid ${miembro.color}` } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{turno.nombre_paciente}</p>
            <EstadoBadge estado={turno.estado} />
            {miembro && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-0.5 text-xs"
                style={{ color: miembro.color }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: miembro.color }} />
                {miembro.nombre}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-600">
            <span className="font-medium text-slate-700">{hora}</span> · {fecha} · {turno.servicio}
          </p>
          <p className="text-xs text-slate-500">
            {turno.numero_telefono} · {turno.duracion_min} min
          </p>
          {turno.notas && <p className="mt-1 text-xs text-slate-500">{turno.notas}</p>}
        </div>
        {turno.estado !== "cancelado" && (
          <div className="flex items-center gap-1">
            {turno.estado === "pendiente" && (
              <button onClick={onConfirmar} className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50" title="Confirmar">
                <Check className="h-4 w-4" />
              </button>
            )}
            <button onClick={onCancelar} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50" title="Cancelar">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
