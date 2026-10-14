import type { Metadata } from "next";
import { AuthShell } from "~/components/auth/auth-shell";
import { SignupForm } from "~/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create your account — FormKit",
  description: "Create a FormKit account and start building forms in minutes.",
};

export default function SignupPage() {
  return (
    <AuthShell title="Create your account" description="Start building forms in minutes.">
      <SignupForm />
    </AuthShell>
  );
}
