import type { Metadata } from "next";
import { AuthShell } from "~/components/auth/auth-shell";
import { VerifyEmailStatus } from "~/components/auth/verify-email-status";

export const metadata: Metadata = {
  title: "Verify your email — FormKit",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell title="Verify your email" description="One quick step to secure your account.">
      <VerifyEmailStatus token={token} />
    </AuthShell>
  );
}
