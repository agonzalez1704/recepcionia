import { SignIn } from "@clerk/nextjs";
import { AuthSplit } from "@/components/shared/auth-split";

export default function Page() {
  return (
    <AuthSplit>
      <SignIn path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
    </AuthSplit>
  );
}
