import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="flex flex-1 items-center justify-center bg-brand-50 p-6">
      <SignIn path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
    </main>
  );
}
