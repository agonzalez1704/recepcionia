import Link from "next/link";
import { Clock, Calendar, Bot, Check, MessageSquare, Shield, Sparkles, Users } from "lucide-react";
import { PLANES } from "@/core/billing/planes";

const FAQ = [
  {
    q: "¿Cómo conecto mi WhatsApp?",
    a: "Usamos Twilio como proveedor oficial de WhatsApp Business. Te damos los pasos en la sección de Integraciones del dashboard: copiás un par de credenciales de tu cuenta Twilio (o creás una gratis) y listo.",
  },
  {
    q: "¿Cuánto cuesta cada conversación?",
    a: "Las conversaciones de WhatsApp tienen un costo bajo cobrado por Meta (varía por país, ~$0.01-$0.05 USD). Twilio agrega un pequeño markup. Para volumen alto recomendamos migrar a un BSP especializado.",
  },
  {
    q: "¿Cada profesional tiene su propia agenda?",
    a: "Sí. Podés agregar todos los miembros que quieras (médicos, kinesiólogos, terapeutas, etc.), cada uno con sus horarios y servicios. Cuando un paciente pide turno con alguien específico, la IA respeta su disponibilidad individual.",
  },
  {
    q: "¿Se sincroniza con mi Google Calendar?",
    a: "Sí. Conectás una cuenta Google unificada para toda la clínica, o una por miembro del equipo. Los turnos creados por la IA aparecen automáticamente. La IA también respeta los eventos externos: no agenda encima de tus reuniones existentes.",
  },
  {
    q: "¿Y desde mi iPhone?",
    a: "Te damos una URL de calendario .ics que podés suscribir desde Ajustes → Calendario → Agregar cuenta → Otra → Agregar calendario suscrito. Funciona en iPhone, Mac, Outlook y cualquier app que lea iCalendar.",
  },
  {
    q: "¿Mi información está segura?",
    a: "Los datos de cada clínica están aislados a nivel de base de datos (RLS multi-tenant). Los tokens de WhatsApp y Google se cifran en reposo con AES-256-GCM. Nunca compartimos información con terceros.",
  },
  {
    q: "¿Qué pasa si la IA no entiende algo?",
    a: "Si no puede resolver el pedido (caso médico complejo, pregunta ambigua), le ofrece al paciente que la clínica lo llame por teléfono. Vos ves toda la conversación en el dashboard y podés intervenir cuando quieras.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex-1">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="text-lg font-bold text-brand-900">
            Recepción IA
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <a href="#como-funciona" className="hidden text-slate-700 hover:text-brand-900 sm:inline">
              Cómo funciona
            </a>
            <a href="#precios" className="hidden text-slate-700 hover:text-brand-900 sm:inline">
              Precios
            </a>
            <a href="#faq" className="hidden text-slate-700 hover:text-brand-900 sm:inline">
              FAQ
            </a>
            <Link href="/sign-in" className="text-slate-700 hover:text-brand-900">
              Iniciar sesión
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl bg-brand-900 px-4 py-2 font-medium text-white hover:bg-brand-700"
            >
              Probar gratis
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="container py-20 text-center md:py-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-sm font-medium text-brand-900">
            <Sparkles className="h-4 w-4" /> Recepcionista virtual con IA
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Tu consultorio,{" "}
            <span className="bg-gradient-to-r from-brand-900 to-brand-600 bg-clip-text text-transparent">
              siempre disponible
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Atiende a tus pacientes por WhatsApp, agenda turnos y sincroniza tu calendario — automáticamente, las 24 horas.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="rounded-xl bg-brand-900 px-6 py-3 font-medium text-white shadow-lg shadow-brand-900/20 transition hover:bg-brand-700"
            >
              Probar gratis
            </Link>
            <a
              href="#como-funciona"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-medium text-slate-800 hover:bg-slate-50"
            >
              Ver cómo funciona
            </a>
          </div>
        </div>

        {/* Demo mockup de conversación */}
        <div className="container -mb-20 pb-12">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="space-y-2 text-sm">
              <Burbuja lado="user" texto="Hola, quería un turno para limpieza dental esta semana" />
              <Burbuja lado="bot" texto="¡Hola! 😊 Te puedo ofrecer: jueves 10:00, viernes 14:30 o sábado 11:00. ¿Cuál te queda mejor?" />
              <Burbuja lado="user" texto="Viernes 14:30 está perfecto" />
              <Burbuja lado="bot" texto="Listo, ¿me decís tu nombre completo?" />
              <Burbuja lado="user" texto="Juan Pérez" />
              <Burbuja lado="bot" texto="✅ Confirmado, Juan. Te espero el viernes 14:30 para tu limpieza dental." />
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-6 py-32 md:grid-cols-3">
        {[
          { icon: Clock, titulo: "Atención 24/7", texto: "Tus pacientes te escriben cuando quieran. La IA responde al toque." },
          { icon: Calendar, titulo: "Turnos automáticos", texto: "Agenda, confirma, reprograma y cancela. Todo sincronizado con tu calendario." },
          { icon: Bot, titulo: "IA que aprende tu clínica", texto: "Conoce tus servicios, horarios y forma de hablar. Atiende como vos." },
        ].map(({ icon: Icon, titulo, texto }) => (
          <div key={titulo} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <Icon className="mb-3 h-8 w-8 text-brand-600" />
            <h3 className="text-lg font-semibold">{titulo}</h3>
            <p className="mt-2 text-sm text-slate-600">{texto}</p>
          </div>
        ))}
      </section>

      <section id="como-funciona" className="border-t border-slate-100 bg-slate-50">
        <div className="container py-20">
          <h2 className="text-center text-3xl font-bold">Cómo funciona</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            Tres pasos. Diez minutos de setup. Listo para atender pacientes.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { titulo: "Registrate y configurá tu clínica", texto: "Importá los datos desde tu sitio web actual o cargalos a mano. Horarios, servicios y equipo." },
              { titulo: "Conectá WhatsApp y Google Calendar", texto: "Te guiamos paso a paso. Una sola vez. Sin tarjeta de crédito para empezar." },
              { titulo: "La IA atiende a tus pacientes", texto: "Recibís cada conversación en el dashboard. Podés intervenir o dejarla trabajar sola." },
            ].map((paso, i) => (
              <div key={paso.titulo} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-900 text-lg font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="text-base font-semibold">{paso.titulo}</h3>
                <p className="mt-2 text-sm text-slate-600">{paso.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20">
        <h2 className="text-center text-3xl font-bold">Para quién es</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
          Cualquier profesional o equipo de salud que agende turnos.
        </p>
        <ul className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 text-slate-700 md:grid-cols-3">
          {["Médicos generales", "Odontólogos", "Kinesiólogos", "Psicólogos", "Nutricionistas", "Veterinarios"].map(
            (p) => (
              <li key={p} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3">
                <Check className="h-4 w-4 text-salud-500" /> {p}
              </li>
            ),
          )}
        </ul>
      </section>

      <section className="border-t border-slate-100 bg-brand-50/50">
        <div className="container py-20">
          <h2 className="text-center text-3xl font-bold">Lo que viene incluido</h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            {[
              { icon: MessageSquare, titulo: "Dashboard de mensajes", texto: "Ves cada conversación en tiempo real. Buscás por número, intervenís si querés." },
              { icon: Users, titulo: "Multi-profesional", texto: "Cada miembro del equipo con su agenda, color y servicios. La IA respeta a cada uno." },
              { icon: Calendar, titulo: "Calendarios sincronizados", texto: "Google Calendar (unificado o por miembro) + feed .ics para iPhone/Mac." },
              { icon: Shield, titulo: "Datos seguros", texto: "Aislamiento total entre clínicas, tokens cifrados, RLS multi-tenant en Postgres." },
            ].map(({ icon: Icon, titulo, texto }) => (
              <div key={titulo} className="flex gap-4 rounded-2xl bg-white p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{titulo}</h3>
                  <p className="mt-0.5 text-sm text-slate-600">{texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="precios" className="border-t border-slate-100 bg-slate-50">
        <div className="container py-20">
          <h2 className="text-center text-3xl font-bold">Precios simples</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            Una fracción del costo de una recepcionista. Sin permanencia — cancelás cuando quieras.
          </p>
          <div className="mx-auto mt-12 grid max-w-5xl items-start gap-6 md:grid-cols-3">
            {PLANES.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border bg-white p-6 ${
                  plan.destacado ? "border-brand-600 shadow-lg shadow-brand-900/10 ring-1 ring-brand-600" : "border-slate-200"
                }`}
              >
                {plan.destacado && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-900 px-3 py-1 text-xs font-medium text-white">
                    Más elegido
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.nombre}</h3>
                <p className="mt-1 text-sm text-slate-600">{plan.descripcion}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${plan.precioUsd}</span>
                  <span className="text-slate-500">USD/mes</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-salud-500" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-up"
                  className={`mt-6 block rounded-xl px-4 py-2.5 text-center font-medium ${
                    plan.destacado
                      ? "bg-brand-900 text-white hover:bg-brand-700"
                      : "border border-slate-300 text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  Empezar
                </Link>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-slate-500">
            Los precios no incluyen los costos de WhatsApp (Twilio/Meta), que se facturan por separado según tu volumen y país.
          </p>
        </div>
      </section>

      <section id="faq" className="container py-20">
        <h2 className="text-center text-3xl font-bold">Preguntas frecuentes</h2>
        <div className="mx-auto mt-10 max-w-2xl divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium">
                <span>{q}</span>
                <span className="text-brand-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-brand-900">
        <div className="container py-16 text-center text-white">
          <h2 className="text-3xl font-bold">Probalo gratis</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Sin tarjeta de crédito. Configurás tu clínica en 10 minutos.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 font-medium text-brand-900 hover:bg-brand-50"
          >
            Crear cuenta
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Recepción IA — Hecho con cariño para profesionales de la salud.
      </footer>
    </main>
  );
}

function Burbuja({ lado, texto }: { lado: "user" | "bot"; texto: string }) {
  const esUser = lado === "user";
  return (
    <div className={`flex ${esUser ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 ${
          esUser ? "bg-slate-100 text-slate-800" : "bg-brand-50 text-brand-900"
        }`}
      >
        {texto}
      </div>
    </div>
  );
}
