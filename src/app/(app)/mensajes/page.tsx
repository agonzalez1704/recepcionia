import { MensajesView } from "./view";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default function MensajesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Mensajes"
        descripcion="Conversaciones de la IA con tus pacientes. Se actualiza cada 5 segundos."
      />
      <MensajesView />
    </div>
  );
}
