"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/components/shared/api";
import type { Miembro } from "@/core/entities/miembro";
import type { Horario } from "@/core/entities/organizacion";

const COLORES = ["#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];
const DIAS: { id: Horario["dia"]; label: string }[] = [
  { id: "lun", label: "Lun" },
  { id: "mar", label: "Mar" },
  { id: "mie", label: "Mié" },
  { id: "jue", label: "Jue" },
  { id: "vie", label: "Vie" },
  { id: "sab", label: "Sáb" },
  { id: "dom", label: "Dom" },
];

export function MiembroForm({
  inicial,
  servicios,
  onCancel,
  onSaved,
}: {
  inicial?: Miembro;
  servicios: string[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [rol, setRol] = useState(inicial?.rol ?? "");
  const [especialidad, setEspecialidad] = useState(inicial?.especialidad ?? "");
  const [bio, setBio] = useState(inicial?.bio ?? "");
  const [color, setColor] = useState(inicial?.color ?? COLORES[0]);
  const [serviciosSel, setServiciosSel] = useState<string[]>(inicial?.servicios ?? []);
  const [horarios, setHorarios] = useState<Horario[]>(inicial?.horarios ?? []);
  const [usaHorariosPropios, setUsaHorariosPropios] = useState((inicial?.horarios ?? []).length > 0);

  const guardar = useMutation({
    mutationFn: async () => {
      const body = {
        nombre,
        rol: rol || null,
        especialidad: especialidad || null,
        bio: bio || null,
        color,
        servicios: serviciosSel,
        horarios: usaHorariosPropios ? horarios : [],
      };
      if (inicial) {
        return apiFetch<Miembro>(`/api/equipo/${inicial.id}`, { method: "PATCH", body: JSON.stringify(body) });
      }
      return apiFetch<Miembro>("/api/equipo", { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      toast.success(inicial ? "Actualizado" : "Miembro creado");
      onSaved();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  function toggleDia(dia: Horario["dia"]) {
    setHorarios((prev) => {
      const exists = prev.find((h) => h.dia === dia);
      if (exists) return prev.filter((h) => h.dia !== dia);
      return [...prev, { dia, desde: "09:00", hasta: "18:00" }];
    });
  }

  function setHora(dia: Horario["dia"], campo: "desde" | "hasta", v: string) {
    setHorarios((prev) => prev.map((h) => (h.dia === dia ? { ...h, [campo]: v } : h)));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        guardar.mutate();
      }}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Nombre *</span>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="input"
            placeholder="Dra. Marta López"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Rol</span>
          <input
            type="text"
            value={rol ?? ""}
            onChange={(e) => setRol(e.target.value)}
            className="input"
            placeholder="Odontóloga, Kinesiólogo, etc."
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Especialidad</span>
        <input
          type="text"
          value={especialidad ?? ""}
          onChange={(e) => setEspecialidad(e.target.value)}
          className="input"
          placeholder="Gastroenterología · Psiquiatría · Tatuaje black & gray"
        />
        <span className="block text-xs text-slate-500">
          La IA usa esto para derivar a cada paciente con el profesional correcto según su necesidad.
        </span>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Descripción / notas para la IA</span>
        <textarea
          rows={2}
          value={bio ?? ""}
          onChange={(e) => setBio(e.target.value)}
          className="input"
          placeholder="Ej: Atiende adultos y niños. Especializada en reflujo y trastornos digestivos."
        />
        <span className="block text-xs text-slate-500">
          Contexto extra para que la IA recomiende mejor. Opcional.
        </span>
      </label>

      <div>
        <span className="block text-sm font-medium">Color</span>
        <div className="mt-1 flex gap-2">
          {COLORES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`h-7 w-7 rounded-full ring-2 ${color === c ? "ring-slate-800" : "ring-transparent"}`}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      {servicios.length > 0 && (
        <div>
          <span className="block text-sm font-medium">Servicios que atiende (vacío = todos)</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {servicios.map((s) => {
              const on = serviciosSel.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setServiciosSel((prev) => (on ? prev.filter((x) => x !== s) : [...prev, s]))
                  }
                  className={`rounded-full border px-3 py-1 text-xs ${
                    on
                      ? "border-brand-600 bg-brand-50 text-brand-900"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={usaHorariosPropios}
            onChange={(e) => setUsaHorariosPropios(e.target.checked)}
          />
          Horarios propios (distintos a los de la clínica)
        </label>
        {usaHorariosPropios && (
          <div className="mt-2 space-y-2">
            {DIAS.map(({ id, label }) => {
              const h = horarios.find((x) => x.dia === id);
              return (
                <div key={id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-sm">
                  <label className="flex w-16 items-center gap-1.5 font-medium">
                    <input type="checkbox" checked={!!h} onChange={() => toggleDia(id)} />
                    {label}
                  </label>
                  {h && (
                    <>
                      <input
                        type="time"
                        value={h.desde}
                        onChange={(e) => setHora(id, "desde", e.target.value)}
                        className="input-sm"
                      />
                      <span className="text-slate-500">a</span>
                      <input
                        type="time"
                        value={h.hasta}
                        onChange={(e) => setHora(id, "hasta", e.target.value)}
                        className="input-sm"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardar.isPending}
          className="rounded-xl bg-brand-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {guardar.isPending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
