import { OnboardingClient } from "./client";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">¿Cómo se llama tu clínica?</h1>
        <p className="text-sm text-slate-600">
          Es el nombre que la IA va a usar al atender a tus pacientes. Podés cambiarlo después.
        </p>
      </header>
      <OnboardingClient />
    </div>
  );
}
