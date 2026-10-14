"use client";

import Link from "next/link";
import { MailWarning } from "lucide-react";
import { useMe } from "~/hooks/use-me";

export function VerifyEmailBanner() {
  const { data: me } = useMe();

  if (!me || me.emailVerified) return null;

  return (
    <div className="flex items-center gap-2.5 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning-foreground sm:px-6">
      <MailWarning className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">
        Please verify your email address to unlock all features.
      </span>
      <Link href="/verify-email" className="shrink-0 font-medium underline underline-offset-2">
        Learn more
      </Link>
    </div>
  );
}
