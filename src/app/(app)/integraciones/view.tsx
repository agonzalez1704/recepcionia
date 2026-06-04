"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, MessageSquare, Calendar, Smartphone, Plug2, RefreshCcw, Users, X } from "lucide-react";
import { apiFetch } from "@/components/shared/api";

type IntegracionGoogleItem = {
  id: string;
  miembro_id: string | null;
  email_google: string;
  calendario_id: string;
  activo: boolean;
};

type MiembroLite = { id: string; nombre: string; color: string };

type IntegracionesData = {
  whatsapp: { id: string; numero_whatsapp: string; activo: boolean } | null;
  google: IntegracionGoogleItem[];
  miembros: MiembroLite[];
  ics: { url: string };
};

export function IntegracionesView({ readOnly }: { readOnly: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["integraciones"],
    queryFn: () => apiFetch<IntegracionesData>("/api/integraciones"),
  });

  // Mostrar toast si volvimos del flujo OAuth con resultado
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ok = params.get("google_ok");
    const err = params.get("google_error");
    if (ok) {
      toast.success(`Conectado como ${ok}`);
      void qc.invalidateQueries({ queryKey: ["integraciones"] });
    } else if (err) {
      toast.error(`Google falló: ${err}`);
    }
    if (ok || err) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [qc]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Whatsapp readOnly={readOnly} />
      <Google
        readOnly={readOnly}
        google={data?.google ?? []}
        miembros={data?.miembros ?? []}
        onCambio={() => qc.invalidateQueries({ queryKey: ["integraciones"] })}
      />
      <Ics
        url={data?.ics.url ?? ""}
        readOnly={readOnly}
        onRegen={() => qc.invalidateQueries({ queryKey: ["integraciones"] })}
      />
    </div>
  );
}

// =================== WhatsApp (Kapso) ===================

type EstadoWA = {
  numero_whatsapp: string | null;
  estado_sender: string;
  connection_type: string | null;
  conectado: boolean;
} | null;

const ETIQUETA_ESTADO_WA: Record<string, string> = {
  sin_configurar: "No conectado",
  creando: "Conexión en proceso",
  pendiente_otp: "Esperando verificación",
  en_revision: "En revisión de Meta",
  online: "Conectado",
  offline: "Desconectado",
};

function Whatsapp({ readOnly }: { readOnly: boolean }) {
  const qc = useQueryClient();
  const { data: estado, isLoading } = useQuery({
    queryKey: ["whatsapp-estado"],
    queryFn: () => apiFetch<EstadoWA>("/api/integraciones/whatsapp"),
    refetchInterval: (q) => {
      const e = (q.state.data as EstadoWA)?.estado_sender;
      return e === "creando" || e === "en_revision" ? 8000 : false;
    },
  });

  // Toast al volver del setup link de Kapso
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const wa = params.get("wa");
    if (wa === "ok") {
      toast.success("WhatsApp conectado 🎉 Puede tardar unos segundos en activarse.");
      void qc.invalidateQueries({ queryKey: ["whatsapp-estado"] });
    } else if (wa === "error") {
      toast.error("No se pudo conectar WhatsApp. Probá de nuevo o pedinos ayuda.");
    }
    if (wa) window.history.replaceState({}, "", window.location.pathname);
  }, [qc]);

  const conectar = useMutation({
    mutationFn: () => apiFetch<{ url: string }>("/api/integraciones/whatsapp/conectar", { method: "POST", body: "{}" }),
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const desconectar = useMutation({
    mutationFn: () => apiFetch("/api/integraciones/whatsapp", { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Desconectado");
      void qc.invalidateQueries({ queryKey: ["whatsapp-estado"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const conectado = !!estado?.conectado;
  const enProceso = !!estado && !conectado && estado.estado_sender !== "sin_configurar";

  return (
    <Section titulo="WhatsApp" icon={MessageSquare} conectado={conectado}>
      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : conectado ? (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div>
            <p className="font-medium">{estado?.numero_whatsapp ?? "Número conectado"}</p>
            <p className="text-xs text-slate-500">
              Conectado{estado?.connection_type ? ` · ${estado.connection_type === "coexistence" ? "coexistencia (mantenés la app)" : "dedicado"}` : ""}
            </p>
          </div>
          {!readOnly && (
            <button
              onClick={() => { if (confirm("¿Desconectar WhatsApp? El agente dejará de responder.")) desconectar.mutate(); }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
            >
              Desconectar
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Conectá el WhatsApp de tu clínica. Tus pacientes ven el nombre y logo de tu clínica. Podés usar tu número actual
            (manteniendo la app de WhatsApp Business) o uno dedicado.
          </p>

          {enProceso && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Conexión en proceso. Si abriste el asistente de Meta y lo cerraste sin terminar, volvé a intentar.
            </div>
          )}

          {!readOnly && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => conectar.mutate()}
                disabled={conectar.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {conectar.isPending ? "Generando enlace…" : "Conectar WhatsApp"}
              </button>
              <a
                href="mailto:soporte@recepcionia.app?subject=Ayuda%20para%20conectar%20mi%20WhatsApp"
                className="text-sm font-medium text-brand-700 hover:underline"
              >
                ¿Necesitás ayuda? Te lo conectamos nosotros
              </a>
            </div>
          )}

          <details className="text-sm text-slate-600">
            <summary className="cursor-pointer font-medium">¿Cómo es el proceso?</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Tocás &quot;Conectar WhatsApp&quot; → te lleva al asistente seguro de Meta.</li>
              <li>Iniciás sesión con Facebook y elegís tu número (existente o nuevo).</li>
              <li>Verificás el número (~5 min) y volvés acá. Listo.</li>
            </ol>
            <p className="mt-2 text-xs text-slate-500">
              Es un paso único que pide Meta para cualquier WhatsApp Business. Si te traba, escribinos y lo hacemos juntos.
            </p>
          </details>
        </div>
      )}
    </Section>
  );
}


// =================== Google ===================

function Google({
  readOnly,
  google,
  miembros,
  onCambio,
}: {
  readOnly: boolean;
  google: IntegracionGoogleItem[];
  miembros: MiembroLite[];
  onCambio: () => void;
}) {
  const unificada = google.find((g) => g.miembro_id === null) ?? null;
  const porMiembro = new Map(google.filter((g) => g.miembro_id).map((g) => [g.miembro_id!, g]));
  const conectado = google.some((g) => g.activo);

  return (
    <Section titulo="Google Calendar" icon={Calendar} conectado={conectado}>
      <p className="text-sm text-slate-700">
        Sincronizá turnos con Google Calendar. Conectá una agenda <strong>unificada</strong> para toda la clínica, o conectá una agenda <strong>por miembro</strong> para que cada profesional reciba solo sus turnos.
      </p>

      <div className="mt-4 space-y-3">
        <GoogleFila
          titulo="Calendario unificado de la clínica"
          subtitulo="Recibe todos los turnos sin miembro asignado, y los de miembros sin agenda propia."
          actual={unificada}
          startHref="/api/oauth/google/start"
          readOnly={readOnly}
          onCambio={onCambio}
        />

        {miembros.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Users className="h-4 w-4" /> Calendarios por miembro
            </div>
            <ul className="space-y-2">
              {miembros.map((m) => {
                const integ = porMiembro.get(m.id) ?? null;
                return (
                  <li key={m.id}>
                    <GoogleFila
                      titulo={m.nombre}
                      colorChip={m.color}
                      actual={integ}
                      startHref={`/api/oauth/google/start?miembro_id=${m.id}`}
                      readOnly={readOnly}
                      onCambio={onCambio}
                      compacto
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </Section>
  );
}

function GoogleFila({
  titulo,
  subtitulo,
  colorChip,
  actual,
  startHref,
  readOnly,
  onCambio,
  compacto,
}: {
  titulo: string;
  subtitulo?: string;
  colorChip?: string;
  actual: IntegracionGoogleItem | null;
  startHref: string;
  readOnly: boolean;
  onCambio: () => void;
  compacto?: boolean;
}) {
  const desconectar = useMutation({
    mutationFn: () => apiFetch(`/api/integraciones/google/${actual!.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Desconectado");
      onCambio();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white ${
        compacto ? "p-3" : "p-4"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {colorChip && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorChip }} />}
          <p className="font-medium">{titulo}</p>
          {actual?.activo && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Conectado
            </span>
          )}
        </div>
        {subtitulo && <p className="text-xs text-slate-500">{subtitulo}</p>}
        {actual && (
          <p className="mt-0.5 truncate text-xs text-slate-600">
            <span className="text-slate-400">como</span> {actual.email_google}
          </p>
        )}
      </div>
      {!readOnly && (
        <div className="flex shrink-0 items-center gap-2">
          {actual ? (
            <button
              onClick={() => {
                if (confirm("¿Desconectar esta cuenta de Google?")) desconectar.mutate();
              }}
              disabled={desconectar.isPending}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              title="Desconectar"
            >
              <X className="h-3.5 w-3.5" /> Desconectar
            </button>
          ) : (
            <a
              href={startHref}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              <Plug2 className="h-3.5 w-3.5" /> Conectar
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// =================== ICS / iOS ===================

function Ics({ url, readOnly, onRegen }: { url: string; readOnly: boolean; onRegen: () => void }) {
  const regen = useMutation({
    mutationFn: () => apiFetch<{ url: string }>("/api/integraciones/ics/regenerar", { method: "POST" }),
    onSuccess: () => {
      toast.success("Token regenerado. La URL anterior dejó de funcionar.");
      onRegen();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  return (
    <Section titulo="Apple / iOS Calendar (suscripción .ics)" icon={Smartphone} conectado={true}>
      <p className="text-sm text-slate-700">
        Suscribite a tu calendario de turnos desde iPhone, Mac o cualquier app que lea iCalendar.
      </p>
      <CopiarLinea texto={url} />
      <details className="mt-3 text-sm text-slate-600">
        <summary className="cursor-pointer font-medium">Instrucciones para iPhone</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          <li>Abrí <strong>Ajustes</strong> en tu iPhone.</li>
          <li>Tocá <strong>Calendario</strong> → <strong>Cuentas</strong> → <strong>Agregar cuenta</strong>.</li>
          <li>Elegí <strong>Otra</strong> → <strong>Agregar calendario suscrito</strong>.</li>
          <li>Pegá la URL de arriba y guardá.</li>
        </ol>
      </details>
      <p className="mt-3 text-xs text-slate-500">
        Es read-only: iOS ve tus turnos pero no podés crear desde ahí (eso lo hace la IA por WhatsApp).
      </p>
      {!readOnly && (
        <button
          onClick={() => regen.mutate()}
          disabled={regen.isPending}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          {regen.isPending ? "Regenerando…" : "Regenerar token"}
        </button>
      )}
    </Section>
  );
}

// =================== shared ===================

function Section({
  titulo,
  icon: Icon,
  conectado,
  children,
}: {
  titulo: string;
  icon: React.ComponentType<{ className?: string }>;
  conectado: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-brand-700" />
          <h2 className="text-lg font-semibold">{titulo}</h2>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
            conectado ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-50 text-slate-600 ring-slate-200"
          }`}
        >
          {conectado ? "Conectado" : "No conectado"}
        </span>
      </header>
      {children}
    </section>
  );
}

function CopiarLinea({ texto }: { texto: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <code className="flex-1 truncate text-xs">{texto}</code>
      <button
        onClick={() => {
          void navigator.clipboard.writeText(texto);
          toast.success("Copiado");
        }}
        className="rounded-lg p-1.5 text-slate-600 hover:bg-white"
        title="Copiar"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
