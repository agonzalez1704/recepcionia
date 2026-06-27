import { Calendar, Users } from "lucide-react";
import { Section } from "./section";
import { GoogleFila } from "./google-fila";
import type { IntegracionGoogleItem, MiembroLite } from "./tipos";

export function Google({
  readOnly,
  google,
  miembros,
  onCambio,
}: {
  readOnly: boolean;
  google: IntegracionGoogleItem[];
  miembros: MiembroLite[];
  onCambio: () => void;
}) {
  const unificada = google.find((g) => g.miembro_id === null) ?? null;
  const porMiembro = new Map(google.filter((g) => g.miembro_id).map((g) => [g.miembro_id!, g]));
  const conectado = google.some((g) => g.activo);

  return (
    <Section titulo="Google Calendar" icon={Calendar} conectado={conectado}>
      <p className="text-sm text-slate-700">
        Sincronizá turnos con Google Calendar. Conectá una agenda <strong>unificada</strong> para toda la clínica, o conectá una agenda <strong>por miembro</strong> para que cada profesional reciba solo sus turnos.
      </p>

      <div className="mt-4 space-y-3">
        <GoogleFila
          titulo="Calendario unificado de la clínica"
          subtitulo="Recibe todos los turnos sin miembro asignado, y los de miembros sin agenda propia."
          actual={unificada}
          startHref="/api/oauth/google/start"
          readOnly={readOnly}
          onCambio={onCambio}
        />

        {miembros.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Users className="h-4 w-4" /> Calendarios por miembro
            </div>
            <ul className="space-y-2">
              {miembros.map((m) => {
                const integ = porMiembro.get(m.id) ?? null;
                return (
                  <li key={m.id}>
                    <GoogleFila
                      titulo={m.nombre}
                      colorChip={m.color}
                      actual={integ}
                      startHref={`/api/oauth/google/start?miembro_id=${m.id}`}
                      readOnly={readOnly}
                      onCambio={onCambio}
                      compacto
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </Section>
  );
}
