"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Bot, User } from "lucide-react";
import { apiFetch } from "@/components/shared/api";
import { formatearChat } from "@/lib/fechas";
import { cn } from "@/lib/utils";
import type { Mensaje } from "@/core/entities/mensaje";

export function MensajesView() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data: mensajes, isLoading, error } = useQuery({
    queryKey: ["mensajes", search],
    queryFn: () => apiFetch<Mensaje[]>(`/api/mensajes?limit=100${search ? `&numero=${encodeURIComponent(search)}` : ""}`),
    refetchInterval: 5000,
  });

  // Mensajes vienen DESC por recibido_en. Para chat queremos ASC.
  const ordenados = useMemo(() => (mensajes ?? []).slice().reverse(), [mensajes]);

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput.trim());
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar por número de teléfono"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input pl-9"
          />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSearchInput("");
            }}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Limpiar
          </button>
        )}
      </form>

      <div className="h-[600px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
        {isLoading && <p className="text-center text-sm text-slate-500">Cargando mensajes…</p>}
        {error && <p className="text-center text-sm text-red-600">{(error as Error).message}</p>}
        {!isLoading && ordenados.length === 0 && (
          <p className="text-center text-sm text-slate-500">
            {search ? "No hay mensajes para ese número." : "Todavía no hay mensajes. Cuando tus pacientes escriban a tu WhatsApp aparecerán acá."}
          </p>
        )}
        <ul className="space-y-3">
          {ordenados.map((m) => (
            <Burbuja key={m.id} mensaje={m} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function Burbuja({ mensaje }: { mensaje: Mensaje }) {
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
