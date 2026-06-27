export function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
