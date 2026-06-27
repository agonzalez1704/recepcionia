import Link from "next/link";
import { Clock, Calendar, Bot, Check, MessageSquare, Shield, Users } from "lucide-react";
import { PLANES } from "@/core/billing/planes";
import { Hero } from "./(marketing)/hero";
import { Logo } from "@/components/shared/logo";
import { Eyebrow } from "./(marketing)/components/eyebrow";
import { Titulo } from "./(marketing)/components/titulo";
import { Subtitulo } from "./(marketing)/components/subtitulo";

const FAQ = [
  {
    q: "¿Cómo conecto mi WhatsApp?",
    a: "Desde la sección de Integraciones del dashboard generás un enlace de conexión y vinculás tu número de WhatsApp Business en unos minutos. Si ya tenés un número en uso, te ayudamos a migrarlo sin perder tus chats.",
  },
  {
    q: "¿Cuánto cuesta cada conversación?",
    a: "Las conversaciones de WhatsApp tienen un costo bajo cobrado por Meta (varía por país, ~$0.01-$0.05 USD). Ya está incluido en tu plan según el tope mensual de conversaciones; no necesitás contratar nada aparte.",
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
      <Hero />

      {/* Beneficios */}
      <section className="container py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Clock, titulo: "Atención 24/7", texto: "Tus pacientes te escriben cuando quieran. La IA responde al toque." },
            { icon: Calendar, titulo: "Turnos automáticos", texto: "Agenda, confirma, reprograma y cancela. Todo sincronizado con tu calendario." },
            { icon: Bot, titulo: "IA que aprende tu clínica", texto: "Conoce tus servicios, horarios y forma de hablar. Atiende como vos." },
          ].map(({ icon: Icon, titulo, texto }) => (
            <div
              key={titulo}
              className="group rounded-3xl border border-slate-200 bg-white p-7 transition hover:border-brand-300 hover:shadow-lg hover:shadow-brand-900/5"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-inter text-lg font-bold text-slate-900">{titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="border-t border-slate-100 bg-slate-50">
        <div className="container py-24">
          <Eyebrow>Setup en minutos</Eyebrow>
          <Titulo>Cómo funciona</Titulo>
          <Subtitulo>Tres pasos. Diez minutos. Listo para atender pacientes.</Subtitulo>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              { titulo: "Configurá tu clínica", texto: "Importá los datos desde tu sitio web o cargalos a mano. Horarios, servicios y equipo." },
              { titulo: "Conectá WhatsApp y tu calendario", texto: "Te guiamos paso a paso. Una sola vez. Sin tarjeta de crédito para empezar." },
              { titulo: "La IA atiende a tus pacientes", texto: "Recibís cada conversación en el dashboard. Intervenís o la dejás trabajar sola." },
            ].map((paso, i) => (
              <div key={paso.titulo} className="relative rounded-3xl border border-slate-200 bg-white p-7">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand-900 font-inter text-lg font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="font-inter text-base font-bold text-slate-900">{paso.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{paso.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quién */}
      <section className="container py-24">
        <Eyebrow>Para tu especialidad</Eyebrow>
        <Titulo>Para quién es</Titulo>
        <Subtitulo>Cualquier profesional o equipo de salud que agende turnos.</Subtitulo>
        <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
          {["Médicos generales", "Odontólogos", "Kinesiólogos", "Psicólogos", "Nutricionistas", "Veterinarios"].map(
            (p) => (
              <li
                key={p}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
              >
                <Check className="h-4 w-4 text-brand-600" /> {p}
              </li>
            ),
          )}
        </ul>
      </section>

      {/* Lo que viene incluido */}
      <section className="border-t border-slate-100 bg-gradient-to-b from-brand-50/60 to-white">
        <div className="container py-24">
          <Eyebrow>Todo en uno</Eyebrow>
          <Titulo>Lo que viene incluido</Titulo>
          <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
            {[
              { icon: MessageSquare, titulo: "Dashboard de mensajes", texto: "Ves cada conversación en tiempo real. Buscás por número, intervenís si querés." },
              { icon: Users, titulo: "Multi-profesional", texto: "Cada miembro con su agenda, color y servicios. La IA deriva al especialista correcto." },
              { icon: Calendar, titulo: "Calendarios sincronizados", texto: "Google Calendar (unificado o por miembro) + feed .ics para iPhone/Mac." },
              { icon: Shield, titulo: "Datos seguros", texto: "Aislamiento total entre clínicas, tokens cifrados, RLS multi-tenant en Postgres." },
            ].map(({ icon: Icon, titulo, texto }) => (
              <div key={titulo} className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-inter font-bold text-slate-900">{titulo}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="relative overflow-hidden border-t border-slate-100 bg-white">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[820px] -translate-x-1/2"
          style={{ background: "radial-gradient(ellipse at center, rgba(56,189,248,0.14), transparent 70%)" }}
        />
        <div className="container relative py-24">
          <Eyebrow>Precios simples</Eyebrow>
          <Titulo>Elegí tu plan</Titulo>
          <Subtitulo>
            Una fracción del costo de una recepcionista — sin sueldo, sin ausencias, 24/7. Sin permanencia.
          </Subtitulo>

          <div className="mx-auto mt-14 grid max-w-5xl items-stretch gap-6 md:grid-cols-3">
            {PLANES.map((plan) => {
              const dark = plan.destacado;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-3xl p-8 transition ${
                    dark
                      ? "bg-nest-fondo text-white shadow-2xl shadow-brand-900/30 ring-1 ring-nest-azul/40 md:-translate-y-3"
                      : "border border-slate-200 bg-white hover:border-brand-300"
                  }`}
                >
                  {dark && (
                    <>
                      <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-32 rounded-t-3xl"
                        style={{ background: "radial-gradient(ellipse at top, rgba(56,189,248,0.3), transparent 70%)" }}
                      />
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-nest-azul px-3 py-1 text-xs font-bold uppercase tracking-wide text-nest-fondo">
                        Más elegido
                      </span>
                    </>
                  )}

                  <div className="relative">
                    <h3 className={`font-inter text-lg font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                      {plan.nombre}
                    </h3>
                    <p className={`mt-1 text-sm ${dark ? "text-white/60" : "text-slate-600"}`}>{plan.descripcion}</p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span
                        className={`font-inter text-5xl font-extrabold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}
                      >
                        ${plan.precioUsd}
                      </span>
                      <span className={dark ? "text-white/50" : "text-slate-500"}>USD/mes</span>
                    </div>

                    {/* Métrica destacada */}
                    <div
                      className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                        dark ? "bg-nest-azul/15 text-nest-azul" : "bg-brand-50 text-brand-700"
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {plan.topeConversaciones.toLocaleString("es-AR")} conversaciones / mes
                    </div>

                    <ul className="mt-6 space-y-2.5 text-sm">
                      {plan.features.map((f) => (
                        <li key={f} className={`flex items-start gap-2 ${dark ? "text-white/80" : "text-slate-700"}`}>
                          <Check className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? "text-nest-azul" : "text-brand-600"}`} /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href="/sign-up"
                    className={`relative mt-8 block rounded-full px-4 py-3 text-center font-inter font-bold uppercase tracking-wide transition ${
                      dark
                        ? "bg-nest-azul text-nest-fondo hover:brightness-110"
                        : "border border-slate-300 text-slate-800 hover:border-brand-600 hover:text-brand-700"
                    }`}
                  >
                    Empezar
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Reaseguros */}
          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
            {["Sin permanencia", "Cancelás cuando quieras", "Soporte en español"].map((r) => (
              <span key={r} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-brand-600" /> {r}
              </span>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-slate-500">
            Los precios no incluyen los costos de conversación de WhatsApp (Meta), que se facturan por separado según tu
            volumen y país.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container py-24">
        <Eyebrow>Dudas</Eyebrow>
        <Titulo>Preguntas frecuentes</Titulo>
        <div className="mx-auto mt-12 max-w-2xl divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-200 bg-white">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-inter font-semibold text-slate-900">
                <span>{q}</span>
                <span className="text-xl text-brand-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden bg-nest-fondo">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[700px] -translate-x-1/2"
          style={{ background: "radial-gradient(ellipse at center, rgba(56,189,248,0.25), transparent 70%)" }}
        />
        <div className="container relative py-20 text-center text-white">
          <h2 className="font-inter text-3xl font-extrabold uppercase tracking-tight sm:text-5xl">
            Probalo gratis<span className="text-nest-azul">.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Sin tarjeta de crédito. Configurás tu clínica en 10 minutos.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-nest-azul px-7 py-3 font-inter font-bold uppercase text-nest-fondo transition hover:brightness-110"
          >
            Crear cuenta
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-10 text-center text-sm text-slate-500">
        <div className="flex justify-center">
          <Logo height={34} />
        </div>
        <p className="mt-3">© {new Date().getFullYear()} GastroCare — Salud digestiva integral.</p>
      </footer>
    </main>
  );
}
