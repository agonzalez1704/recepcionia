import { OnboardingClient } from "./client";
import { Logo } from "@/components/shared/logo";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Logo height={44} />
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">¿Cómo se llama tu clínica?</h1>
        <p className="mt-1 text-sm text-slate-600">
          Es el nombre que la IA va a usar al atender a tus pacientes. Podés cambiarlo después.
        </p>
      </header>
      <OnboardingClient />
    </div>
  );
}
