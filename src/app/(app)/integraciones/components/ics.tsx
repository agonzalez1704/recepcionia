"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Smartphone, RefreshCcw } from "lucide-react";
import { apiFetch } from "@/components/shared/api";
import { Section } from "./section";
import { CopiarLinea } from "./copiar-linea";

export function Ics({ url, readOnly, onRegen }: { url: string; readOnly: boolean; onRegen: () => void }) {
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
