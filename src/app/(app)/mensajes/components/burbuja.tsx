import { Bot, User } from "lucide-react";
import { formatearChat } from "@/lib/fechas";
import { cn } from "@/lib/utils";
import type { Mensaje } from "@/core/entities/mensaje";

export function Burbuja({ mensaje }: { mensaje: Mensaje }) {
  const esPaciente = mensaje.remitente === "paciente";
  return (
    <li className={cn("flex items-end gap-2", esPaciente ? "justify-start" : "justify-end")}>
      {esPaciente && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <User className="h-4 w-4" />
        </div>
      )}
      <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm", esPaciente ? "bg-slate-100 text-slate-900" : "bg-brand-50 text-brand-900")}>
        <div className="mb-1 flex items-center gap-2 text-xs">
          <span className={cn("font-medium", esPaciente ? "text-slate-600" : "text-brand-700")}>
            {esPaciente ? mensaje.numero_telefono : "Asistente IA"}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">{formatearChat(mensaje.recibido_en)}</span>
        </div>
        <p className="whitespace-pre-wrap leading-snug">{mensaje.contenido}</p>
      </div>
      {!esPaciente && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <Bot className="h-4 w-4" />
        </div>
      )}
    </li>
  );
}
