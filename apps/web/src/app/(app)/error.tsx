"use client";

import { useEffect } from "react";
import { ErrorState } from "~/components/dashboard/error-state";

export default function AppSegmentError({
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
    <div className="mx-auto max-w-6xl">
      <ErrorState
        title="This page hit a snag"
        description="Something went wrong loading this view."
        onRetry={reset}
      />
    </div>
  );
}
