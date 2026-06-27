export function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-3 text-center font-inter text-3xl font-extrabold uppercase tracking-tight text-slate-900 sm:text-4xl">
      {children}
    </h2>
  );
}
