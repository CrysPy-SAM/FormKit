import type { Metadata } from "next";
import { AuthShell } from "~/components/auth/auth-shell";
import { ResetPasswordForm } from "~/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset your password — FormKit",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell title="Set a new password" description="Choose a strong password for your account.">
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
