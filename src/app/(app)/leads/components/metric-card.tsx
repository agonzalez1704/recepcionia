import type { LucideIcon } from "lucide-react";

export function MetricCard({
  icon: Icon,
  label,
  valor,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  valor: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        <Icon className="h-4 w-4 text-brand-600" /> {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-brand-900">{valor}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
