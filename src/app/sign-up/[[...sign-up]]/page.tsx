import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="flex flex-1 items-center justify-center bg-brand-50 p-6">
      <SignUp path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/onboarding" />
    </main>
  );
}
