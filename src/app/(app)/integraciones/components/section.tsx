export function Section({
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
