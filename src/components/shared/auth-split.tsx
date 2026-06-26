import { Logo } from "@/components/shared/logo";
import { MessageCircle, CalendarCheck, Stethoscope } from "lucide-react";

const PUNTOS = [
  { icon: MessageCircle, texto: "Atiende WhatsApp 24/7 con el tono de tu clínica" },
  { icon: Stethoscope, texto: "Canaliza a cada paciente con el especialista correcto" },
  { icon: CalendarCheck, texto: "Agenda y sincroniza citas automáticamente" },
];

/** Layout de autenticación en dos columnas: panel de marca + formulario Clerk. */
export function AuthSplit({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-1">
      {/* Panel de marca */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Halos decorativos suaves */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cielo-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-24 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />

        <Logo chip height={34} className="relative" priority />

        <div className="relative max-w-md">
          <h1 className="font-sans text-3xl font-bold leading-tight text-white">
            La recepción de tu clínica,{" "}
            <span className="text-cielo-400">siempre disponible.</span>
          </h1>
          <ul className="mt-8 space-y-4">
            {PUNTOS.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.texto} className="flex items-start gap-3 text-sm text-white/80">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-cielo-400">
                    <Icon className="h-4 w-4" />
                  </span>
                  {p.texto}
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">Salud digestiva integral · GastroCare</p>
      </div>

      {/* Formulario */}
      <div className="flex w-full flex-col items-center justify-center bg-slate-50 px-6 py-12 lg:w-1/2">
        <div className="mb-8 lg:hidden">
          <Logo height={40} priority />
        </div>
        {children}
      </div>
    </main>
  );
}
