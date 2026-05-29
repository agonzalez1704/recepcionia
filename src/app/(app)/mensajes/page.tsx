import { MensajesView } from "./view";

export const dynamic = "force-dynamic";

export default function MensajesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Mensajes</h1>
        <p className="text-sm text-slate-600">Conversaciones de la IA con tus pacientes. Se actualiza cada 5 segundos.</p>
      </header>
      <MensajesView />
    </div>
  );
}
