"use client";

import { toast } from "sonner";
import { Copy } from "lucide-react";

export function CopiarLinea({ texto }: { texto: string }) {
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
