import { Loader2, Check } from "lucide-react";

export const PASOS_IMPORT = [
  "Conectando con el sitio…",
  "Descargando contenido de la página…",
  "Analizando texto con IA…",
  "Extrayendo horarios y servicios…",
  "Casi listo…",
];

export function ProgresoImport({ pasoIdx }: { pasoIdx: number }) {
  return (
    <div className="mt-4 space-y-3 rounded-xl border border-brand-200 bg-white p-4">
      <ul className="space-y-1.5">
        {PASOS_IMPORT.map((paso, i) => {
          const completado = i < pasoIdx;
          const actual = i === pasoIdx;
          return (
            <li key={paso} className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                {completado ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : actual ? (
                  <Loader2 className="h-4 w-4 animate-spin text-brand-700" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                )}
              </span>
              <span
                className={
                  completado
                    ? "text-slate-500 line-through"
                    : actual
                      ? "font-medium text-brand-900"
                      : "text-slate-400"
                }
              >
                {paso}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full bg-brand-600 transition-all duration-500"
          style={{ width: `${Math.min(((pasoIdx + 1) / PASOS_IMPORT.length) * 100, 95)}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">
        Esto puede tardar 10-20 segundos según el tamaño de la página. No cierres la pestaña.
      </p>
    </div>
  );
}
