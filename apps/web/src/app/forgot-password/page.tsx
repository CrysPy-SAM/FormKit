import type { Metadata } from "next";
import { AuthShell } from "~/components/auth/auth-shell";
import { ForgotPasswordForm } from "~/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password — FormKit",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter your email and we'll send you a reset link."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
