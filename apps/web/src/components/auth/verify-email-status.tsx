"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, MailQuestion, TriangleAlert } from "lucide-react";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";

export function VerifyEmailStatus({ token }: { token: string | undefined }) {
  const verify = trpc.auth.verify.useMutation();
  const attempted = useRef(false);
  const [state, setState] = useState<"idle" | "verifying" | "success" | "error">(
    token ? "verifying" : "idle",
  );

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    verify.mutate(
      { token },
      {
        onSuccess: (data) => setState(data.success ? "success" : "error"),
        onError: () => setState("error"),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (state === "idle") {
    return (
      <div className="flex flex-col items-start gap-4 animate-fade-up">
        <div className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <MailQuestion className="size-5" />
        </div>
        <p className="text-sm text-foreground">
          We sent a verification link to your inbox. Open it on this device to confirm
          your email address.
        </p>
        <Button asChild size="sm" variant="secondary">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    );
  }

  if (state === "verifying") {
    return (
      <div className="flex flex-col items-start gap-4 animate-fade-up">
        <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Verifying your email address…</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-start gap-4 animate-fade-up">
        <div className="flex size-11 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-5" />
        </div>
        <p className="text-sm text-foreground">
          Your email has been verified. You&apos;re all set.
        </p>
        <Button asChild size="sm">
          <Link href="/dashboard">Continue to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-4 animate-fade-up">
      <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" />
      </div>
      <p className="text-sm text-foreground">
        {verify.error?.message ||
          "This verification link is invalid or has expired."}
      </p>
      <Button asChild size="sm" variant="secondary">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  );
}
