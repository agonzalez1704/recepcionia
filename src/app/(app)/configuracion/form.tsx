"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Globe, Sparkles, Loader2, Check } from "lucide-react";
import { apiFetch } from "@/components/shared/api";
import type { Horario, Organizacion, Servicio } from "@/core/entities/organizacion";

type ImportadoData = {
  nombre_clinica: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  zona_horaria: string | null;
  sobre_clinica: string | null;
  horarios: Horario[];
  servicios: { nombre: string; duracion_min: number; descripcion: string }[];
};

const DIAS: { id: Horario["dia"]; label: string }[] = [
  { id: "lun", label: "Lunes" },
  { id: "mar", label: "Martes" },
  { id: "mie", label: "Miércoles" },
  { id: "jue", label: "Jueves" },
  { id: "vie", label: "Viernes" },
  { id: "sab", label: "Sábado" },
  { id: "dom", label: "Domingo" },
];

const ZONAS = [
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/Montevideo",
  "America/Caracas",
  "America/Guatemala",
  "America/Costa_Rica",
  "America/Panama",
  "Europe/Madrid",
];

type Estado = {
  nombre_clinica: string;
  direccion: string;
  telefono: string;
  email: string;
  zona_horaria: string;
  sobre_clinica: string;
  horarios: Horario[];
  servicios: Servicio[];
};

function fromOrg(o: Organizacion): Estado {
  return {
    nombre_clinica: o.nombre_clinica ?? "",
    direccion: o.direccion ?? "",
    telefono: o.telefono ?? "",
    email: o.email ?? "",
    zona_horaria: o.zona_horaria ?? "America/Mexico_City",
    sobre_clinica: o.sobre_clinica ?? "",
    horarios: o.horarios ?? [],
    servicios: o.servicios ?? [],
  };
}

const PASOS_IMPORT = [
  "Conectando con el sitio…",
  "Descargando contenido de la página…",
  "Analizando texto con IA…",
  "Extrayendo horarios y servicios…",
  "Casi listo…",
];

export function ConfiguracionForm({ organizacion, readOnly }: { organizacion: Organizacion; readOnly: boolean }) {
  const [estado, setEstado] = useState<Estado>(() => fromOrg(organizacion));
  const [urlImport, setUrlImport] = useState("");
  const [pasoIdx, setPasoIdx] = useState(0);

  const importar = useMutation({
    mutationFn: (url: string) =>
      apiFetch<ImportadoData>("/api/configuracion/importar", {
        method: "POST",
        body: JSON.stringify({ url }),
      }),
    onSuccess: (data) => {
      setEstado((prev) => ({
        nombre_clinica: data.nombre_clinica ?? prev.nombre_clinica,
        direccion: data.direccion ?? prev.direccion,
        telefono: data.telefono ?? prev.telefono,
        email: data.email ?? prev.email,
        zona_horaria: data.zona_horaria ?? prev.zona_horaria,
        sobre_clinica: data.sobre_clinica ?? prev.sobre_clinica,
        horarios: data.horarios.length > 0 ? data.horarios : prev.horarios,
        servicios:
          data.servicios.length > 0
            ? data.servicios.map((s) => ({
                nombre: s.nombre,
                duracion_min: s.duracion_min,
                descripcion: s.descripcion ?? "",
              }))
            : prev.servicios,
      }));
      toast.success("Datos importados. Revisalos y guardá los cambios.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error al importar"),
  });

  // Rotación pasos mientras importa
  useEffect(() => {
    if (!importar.isPending) {
      setPasoIdx(0);
      return;
    }
    setPasoIdx(0);
    const id = setInterval(() => {
      setPasoIdx((i) => Math.min(i + 1, PASOS_IMPORT.length - 1));
    }, 2500);
    return () => clearInterval(id);
  }, [importar.isPending]);

  const mutation = useMutation({
    mutationFn: async (patch: Estado) => {
      const res = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.mensaje ?? "Error al guardar");
      return json.data as Organizacion;
    },
    onSuccess: (org) => {
      setEstado(fromOrg(org));
      toast.success("Configuración guardada");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    },
  });

  function setField<K extends keyof Estado>(key: K, value: Estado[K]) {
    setEstado((p) => ({ ...p, [key]: value }));
  }

  function toggleDia(dia: Horario["dia"]) {
    setEstado((p) => {
      const existe = p.horarios.find((h) => h.dia === dia);
      if (existe) return { ...p, horarios: p.horarios.filter((h) => h.dia !== dia) };
      return { ...p, horarios: [...p.horarios, { dia, desde: "09:00", hasta: "18:00" }] };
    });
  }

  function setHorario(dia: Horario["dia"], campo: "desde" | "hasta", valor: string) {
    setEstado((p) => ({
      ...p,
      horarios: p.horarios.map((h) => (h.dia === dia ? { ...h, [campo]: valor } : h)),
    }));
  }

  function addServicio() {
    setEstado((p) => ({
      ...p,
      servicios: [...p.servicios, { nombre: "", duracion_min: 30, descripcion: "" }],
    }));
  }

  function updateServicio(idx: number, patch: Partial<Servicio>) {
    setEstado((p) => ({
      ...p,
      servicios: p.servicios.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  }

  function removeServicio(idx: number) {
    setEstado((p) => ({ ...p, servicios: p.servicios.filter((_, i) => i !== idx) }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(estado);
  }

  const disabled = readOnly || mutation.isPending || importar.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {!readOnly && (
        <section className="rounded-2xl border border-brand-100 bg-brand-50/40 p-6">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                importar.isPending ? "bg-brand-200 text-brand-900" : "bg-brand-100 text-brand-700"
              }`}
            >
              {importar.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-brand-900">Importar desde tu sitio web</h2>
              <p className="mt-0.5 text-sm text-slate-600">
                Pegá la URL de tu landing y la IA llena nombre, dirección, horarios, servicios y demás. Después revisás y guardás.
              </p>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://gastrocare.com.mx"
                    value={urlImport}
                    onChange={(e) => setUrlImport(e.target.value)}
                    disabled={importar.isPending}
                    className="input pl-9"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const u = urlImport.trim();
                    if (!u) return toast.error("Pegá una URL");
                    importar.mutate(u);
                  }}
                  disabled={importar.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 sm:whitespace-nowrap"
                >
                  {importar.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {importar.isPending ? "Importando…" : "Importar"}
                </button>
              </div>

              {importar.isPending ? (
                <ProgresoImport pasoIdx={pasoIdx} />
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Tip: usá la URL principal de tu clínica. Si tenés varias páginas con info, importá la que tenga horarios y servicios.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <Section titulo="Datos generales">
        <Field label="Nombre de la clínica" required>
          <input
            type="text"
            required
            value={estado.nombre_clinica}
            onChange={(e) => setField("nombre_clinica", e.target.value)}
            disabled={disabled}
            className="input"
          />
        </Field>
        <Field label="Dirección">
          <input
            type="text"
            value={estado.direccion}
            onChange={(e) => setField("direccion", e.target.value)}
            disabled={disabled}
            className="input"
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Teléfono">
            <input
              type="tel"
              value={estado.telefono}
              onChange={(e) => setField("telefono", e.target.value)}
              disabled={disabled}
              className="input"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={estado.email}
              onChange={(e) => setField("email", e.target.value)}
              disabled={disabled}
              className="input"
            />
          </Field>
        </div>
        <Field label="Zona horaria" required>
          <select
            value={estado.zona_horaria}
            onChange={(e) => setField("zona_horaria", e.target.value)}
            disabled={disabled}
            className="input"
          >
            {ZONAS.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sobre la clínica" hint="Texto libre que la IA usa al presentarse a un paciente.">
          <textarea
            rows={4}
            value={estado.sobre_clinica}
            onChange={(e) => setField("sobre_clinica", e.target.value)}
            disabled={disabled}
            className="input"
          />
        </Field>
      </Section>

      <Section titulo="Horarios de atención">
        <div className="space-y-2">
          {DIAS.map(({ id, label }) => {
            const h = estado.horarios.find((x) => x.dia === id);
            const activo = !!h;
            return (
              <div key={id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <label className="flex w-28 items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={() => toggleDia(id)}
                    disabled={disabled}
                  />
                  {label}
                </label>
                {activo && h && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">De</span>
                    <input
                      type="time"
                      value={h.desde}
                      onChange={(e) => setHorario(id, "desde", e.target.value)}
                      disabled={disabled}
                      className="input-sm"
                    />
                    <span className="text-slate-500">a</span>
                    <input
                      type="time"
                      value={h.hasta}
                      onChange={(e) => setHorario(id, "hasta", e.target.value)}
                      disabled={disabled}
                      className="input-sm"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section titulo="Servicios">
        <div className="space-y-3">
          {estado.servicios.length === 0 && (
            <p className="text-sm text-slate-500">
              Todavía no agregaste servicios. La IA los usa para ofrecer opciones al paciente.
            </p>
          )}
          {estado.servicios.map((s, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3">
              <div className="grid gap-3 md:grid-cols-[1fr_120px_auto]">
                <input
                  type="text"
                  placeholder="Nombre (ej. Limpieza dental)"
                  value={s.nombre}
                  onChange={(e) => updateServicio(i, { nombre: e.target.value })}
                  disabled={disabled}
                  className="input"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={s.duracion_min}
                    onChange={(e) => updateServicio(i, { duracion_min: Number(e.target.value) })}
                    disabled={disabled}
                    className="input"
                  />
                  <span className="text-sm text-slate-500">min</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeServicio(i)}
                  disabled={disabled}
                  className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Eliminar servicio"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Descripción (opcional)"
                value={s.descripcion ?? ""}
                onChange={(e) => updateServicio(i, { descripcion: e.target.value })}
                disabled={disabled}
                className="input mt-2"
              />
            </div>
          ))}
          {!readOnly && (
            <button
              type="button"
              onClick={addServicio}
              disabled={disabled}
              className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" /> Agregar servicio
            </button>
          )}
        </div>
      </Section>

      {!readOnly && (
        <div className="sticky bottom-0 flex justify-end border-t border-slate-100 bg-white py-4">
          <button
            type="submit"
            disabled={disabled}
            className="rounded-xl bg-brand-900 px-6 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {mutation.isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}
    </form>
  );
}

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ProgresoImport({ pasoIdx }: { pasoIdx: number }) {
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

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
