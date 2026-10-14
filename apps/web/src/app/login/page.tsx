import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "~/components/auth/auth-shell";
import { LoginForm } from "~/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in — FormKit",
  description: "Sign in to your FormKit workspace.",
};

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" description="Sign in to continue to your workspace.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
