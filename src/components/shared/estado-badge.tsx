import { cn } from "@/lib/utils";
import type { EstadoTurno } from "@/core/entities/turno";

const ESTILOS: Record<EstadoTurno, string> = {
  pendiente: "bg-amber-50 text-amber-800 ring-amber-200",
  confirmado: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelado: "bg-red-50 text-red-700 ring-red-200",
  completado: "bg-sky-50 text-sky-800 ring-sky-200",
  necesita_reagendar: "bg-orange-100 text-orange-800 ring-orange-300",
};

const LABELS: Record<EstadoTurno, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  completado: "Completado",
  necesita_reagendar: "⚠ Reagendar",
};

export function EstadoBadge({ estado }: { estado: EstadoTurno }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1", ESTILOS[estado])}>
      {LABELS[estado]}
    </span>
  );
}
