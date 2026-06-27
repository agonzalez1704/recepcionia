"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, User } from "lucide-react";
import { apiFetch } from "@/components/shared/api";
import type { Miembro } from "@/core/entities/miembro";
import { MiembroForm } from "./miembro-form";

export function MiembroCard({ miembro, readOnly, servicios }: { miembro: Miembro; readOnly: boolean; servicios: string[] }) {
  const [editando, setEditando] = useState(false);
  const qc = useQueryClient();

  const toggleActivo = useMutation({
    mutationFn: () => apiFetch<Miembro>(`/api/equipo/${miembro.id}`, { method: "PATCH", body: JSON.stringify({ activo: !miembro.activo }) }),
    onSuccess: () => {
      toast.success(miembro.activo ? "Desactivado" : "Activado");
      void qc.invalidateQueries({ queryKey: ["equipo"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const eliminar = useMutation({
    mutationFn: () => apiFetch(`/api/equipo/${miembro.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Miembro eliminado");
      void qc.invalidateQueries({ queryKey: ["equipo"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  if (editando) {
    return (
      <li className="md:col-span-2">
        <MiembroForm
          servicios={servicios}
          inicial={miembro}
          onCancel={() => setEditando(false)}
          onSaved={() => {
            setEditando(false);
            void qc.invalidateQueries({ queryKey: ["equipo"] });
          }}
        />
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: miembro.color }}
        >
          <User className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{miembro.nombre}</h3>
            {!miembro.activo && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Inactivo</span>
            )}
          </div>
          {miembro.rol && <p className="text-sm text-slate-600">{miembro.rol}</p>}
          {miembro.especialidad && (
            <span className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
              {miembro.especialidad}
            </span>
          )}
          {miembro.servicios.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">Atiende: {miembro.servicios.join(", ")}</p>
          )}
          {miembro.horarios.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Horarios propios: {miembro.horarios.map((h) => `${h.dia} ${h.desde}-${h.hasta}`).join(", ")}
            </p>
          )}
        </div>
        {!readOnly && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => setEditando(true)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Editar
            </button>
            <button
              onClick={() => toggleActivo.mutate()}
              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              {miembro.activo ? "Desactivar" : "Activar"}
            </button>
            <button
              onClick={() => {
                if (confirm("¿Eliminar este miembro? Los turnos asignados quedarán sin profesional.")) eliminar.mutate();
              }}
              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
