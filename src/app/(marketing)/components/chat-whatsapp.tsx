import { Check, CheckCheck } from "lucide-react";

// Conversación real (condensada) de la base de datos — triage + reagendado + confirmación.
type Burbuja = { de: "paciente" | "asistente"; texto: string; hora: string };
const CHAT: Burbuja[] = [
  { de: "paciente", texto: "Buenas tardes, me gustaría sacar una cita con el dr memo para mañana", hora: "18:47" },
  {
    de: "asistente",
    texto:
      "Revisé de nuevo y el Dr. Guillermo Carmona sí tiene lugar mañana jueves 28. Te puedo ofrecer 9:00, 11:30 o 15:00. ¿Cuál preferís? 😊",
    hora: "18:51",
  },
  { de: "paciente", texto: "11:30 perfecto", hora: "18:52" },
  {
    de: "asistente",
    texto: "¡Listo! Te agendé con el Dr. Carmona mañana 28 a las 11:30 hs. Te esperamos 🙌",
    hora: "18:52",
  },
];

export function ChatWhatsApp() {
  return (
    <div className="glass-light relative w-full max-w-sm overflow-hidden rounded-3xl">
      <div className="flex items-center gap-3 border-b border-slate-200/70 bg-white/60 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
          C
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">Clínica Carmona</p>
          <p className="text-[11px] text-brand-600">en línea</p>
        </div>
      </div>

      <div className="space-y-2 px-3 py-4">
        {CHAT.map((b, i) => {
          const esPaciente = b.de === "paciente";
          return (
            <div key={i} className={`flex ${esPaciente ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${
                  esPaciente ? "bg-slate-100 text-slate-800" : "bg-brand-50 text-brand-900"
                }`}
              >
                <p className="whitespace-pre-wrap">{b.texto}</p>
                <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                  {b.hora}
                  {!esPaciente && <CheckCheck className="h-3 w-3 text-brand-600" />}
                  {esPaciente && <Check className="h-3 w-3" />}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
