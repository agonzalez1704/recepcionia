import Link from "next/link";
import { Settings, MessageSquare, Calendar, Plug, Users, AlertTriangle } from "lucide-react";
import { getActiveContextOrThrow } from "@/lib/tenant";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { crearTurnoRepo } from "@/infra/insforge/repos/turno-repo";
import { PageHeader } from "@/components/shared/page-header";
import { ProximosTurnos } from "./proximos-turnos";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await getActiveContextOrThrow();
  const org = ctx.organizacion;
  const configCompleta = !!(org.direccion && org.telefono && org.horarios.length > 0 && org.servicios.length > 0);

  const turnoRepo = crearTurnoRepo(getInsforgeAdmin());
  const aReagendar = await turnoRepo.listar(org.id, { estado: "necesita_reagendar" });

  return (
    <div className="space-y-8">
      <PageHeader
        titulo={`Hola, ${org.nombre_clinica}`}
        descripcion="Panel de control. Configurá tu clínica, conectá tus integraciones y revisá mensajes y turnos."
      />

      {aReagendar.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-orange-300 bg-orange-50 p-4 text-sm text-orange-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              {aReagendar.length} turno{aReagendar.length > 1 ? "s" : ""} necesita{aReagendar.length > 1 ? "n" : ""} reagendarse
            </p>
            <p className="mt-0.5">
              Bloqueaste esos horarios en tu Google Calendar y chocan con turnos confirmados.{" "}
              <Link href="/turnos" className="font-semibold underline">
                Revisalos en Turnos
              </Link>{" "}
              y contactá a los pacientes para reprogramar.
            </p>
          </div>
        </div>
      )}

      {!configCompleta && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Tu configuración está incompleta.{" "}
          <Link href="/configuracion" className="font-semibold underline">
            Completala ahora
          </Link>{" "}
          para que la IA pueda atender a tus pacientes con toda la información de la clínica.
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Próximos turnos</h2>
        <ProximosTurnos zonaHoraria={org.zona_horaria} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Atajos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Tile href="/mensajes" icon={MessageSquare} titulo="Mensajes" texto="Conversaciones de la IA con tus pacientes." />
          <Tile href="/turnos" icon={Calendar} titulo="Turnos" texto="Calendario y lista de turnos." />
          <Tile href="/equipo" icon={Users} titulo="Equipo" texto="Profesionales y sus agendas individuales." />
          <Tile href="/configuracion" icon={Settings} titulo="Configuración" texto="Nombre, dirección, horarios, servicios y zona horaria." />
          <Tile href="/integraciones" icon={Plug} titulo="Integraciones" texto="WhatsApp, Google Calendar y feed iOS." />
        </div>
      </section>
    </div>
  );
}

function Tile({
  href,
  icon: Icon,
  titulo,
  texto,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  titulo: string;
  texto: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-brand-600 hover:shadow-sm"
    >
      <Icon className="mb-3 h-6 w-6 text-brand-600" />
      <h3 className="font-semibold">{titulo}</h3>
      <p className="mt-1 text-sm text-slate-600">{texto}</p>
    </Link>
  );
}
