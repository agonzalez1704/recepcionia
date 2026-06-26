import { SignUp } from "@clerk/nextjs";
import { AuthSplit } from "@/components/shared/auth-split";

export default function Page() {
  return (
    <AuthSplit>
      <SignUp path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/onboarding" />
    </AuthSplit>
  );
}
