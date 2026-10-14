"use client";

import { trpc } from "~/trpc/client";
import { cn } from "~/lib/utils";

export function UsagePanel() {
  const { data: subscription } = trpc.workspace.getSubscription.useQuery();
  const { data: forms } = trpc.forms.list.useQuery();

  if (!subscription) {
    return <div className="mx-3 h-16 animate-shimmer bg-shimmer rounded-lg" />;
  }

  const used = forms?.length ?? 0;
  const limit = subscription.limits.maxForms;
  const unlimited = limit === -1;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const nearLimit = !unlimited && pct >= 80;

  return (
    <div className="mx-3 rounded-lg border border-border bg-muted/50 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{subscription.planName} plan</span>
        <span className="text-muted-foreground">
          {used}
          {!unlimited && ` / ${limit}`} forms
        </span>
      </div>
      {!unlimited && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              nearLimit ? "bg-warning" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
