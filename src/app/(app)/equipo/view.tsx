"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, User } from "lucide-react";
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

function MiembroCard({ miembro, readOnly, servicios }: { miembro: Miembro; readOnly: boolean; servicios: string[] }) {
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

function MiembroForm({
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
