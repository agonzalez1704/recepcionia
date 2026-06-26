"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Bot, User, Headset, RotateCcw } from "lucide-react";
import { apiFetch } from "@/components/shared/api";
import { formatearChat } from "@/lib/fechas";
import { cn } from "@/lib/utils";
import type { Mensaje } from "@/core/entities/mensaje";

type ConversacionHandoff = {
  id: string;
  numero_telefono: string;
  motivo: string | null;
  derivado_en: string | null;
};

function HandoffBanner() {
  const qc = useQueryClient();
  const { data: enHandoff = [] } = useQuery({
    queryKey: ["conversaciones-handoff"],
    queryFn: () => apiFetch<ConversacionHandoff[]>("/api/conversaciones"),
    refetchInterval: 5000,
  });

  const reactivar = useMutation({
    mutationFn: (numero: string) =>
      apiFetch("/api/conversaciones", {
        method: "PATCH",
        body: JSON.stringify({ numero, estado: "bot" }),
      }),
    onSuccess: () => {
      toast.success("Bot reactivado para esa conversación");
      void qc.invalidateQueries({ queryKey: ["conversaciones-handoff"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  if (enHandoff.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
        <Headset className="h-4 w-4" />
        {enHandoff.length} conversación{enHandoff.length > 1 ? "es" : ""} en manos del equipo · bot en pausa
      </div>
      <ul className="space-y-2">
        {enHandoff.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-slate-800">{c.numero_telefono}</p>
              {c.motivo && <p className="truncate text-xs text-slate-500">{c.motivo}</p>}
            </div>
            <button
              onClick={() => reactivar.mutate(c.numero_telefono)}
              disabled={reactivar.isPending}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-600 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Devolver al bot
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
      <HandoffBanner />
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
