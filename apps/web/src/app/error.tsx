"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Logo } from "~/components/logo";
import { Button } from "~/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <div>
        <h1 className="font-serif text-2xl text-foreground">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred. You can try again, or head back to the
          homepage.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
