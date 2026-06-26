import { LeadsView } from "./view";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Leads"
        descripcion="Cada conversación de WhatsApp es un lead. Seguí su resultado y cómo viene atendiendo el asistente."
      />
      <LeadsView />
    </div>
  );
}
