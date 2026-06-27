"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { apiFetch } from "@/components/shared/api";
import type { Miembro } from "@/core/entities/miembro";
import { MiembroCard } from "./components/miembro-card";
import { MiembroForm } from "./components/miembro-form";

export function EquipoView({ readOnly, servicios }: { readOnly: boolean; servicios: string[] }) {
  const qc = useQueryClient();
  const { data: miembros = [], isLoading } = useQuery({
    queryKey: ["equipo"],
    queryFn: () => apiFetch<Miembro[]>("/api/equipo"),
  });

  const [creando, setCreando] = useState(false);

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div>
          {!creando ? (
            <button
              onClick={() => setCreando(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Agregar miembro
            </button>
          ) : (
            <MiembroForm
              servicios={servicios}
              onCancel={() => setCreando(false)}
              onSaved={() => {
                setCreando(false);
                void qc.invalidateQueries({ queryKey: ["equipo"] });
              }}
            />
          )}
        </div>
      )}

      {isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
      {!isLoading && miembros.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Todavía no agregaste a nadie. Sin miembros, todos los turnos se agendan contra una agenda compartida.
        </div>
      )}

      <ul className="grid gap-3 md:grid-cols-2">
        {miembros.map((m) => (
          <MiembroCard key={m.id} miembro={m} readOnly={readOnly} servicios={servicios} />
        ))}
      </ul>
    </div>
  );
}
