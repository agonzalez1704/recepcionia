/** Encabezado de página consistente: título navy + descripción + acciones. */
export function PageHeader({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-5">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">{titulo}</h1>
        {descripcion && <p className="mt-1 max-w-2xl text-sm text-slate-600">{descripcion}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </header>
  );
}
