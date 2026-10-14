"use client";

import { Laptop, Smartphone } from "lucide-react";
import { toast } from "sonner";
import type { RouterOutputs } from "@formkit/trpc/client";
import { trpc } from "~/trpc/client";
import { formatDateTime } from "~/lib/format";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

type Session = RouterOutputs["auth"]["sessions"][number];

function parseDevice(userAgent: string | null) {
  if (!userAgent) return { label: "Unknown device", isMobile: false };
  const isMobile = /mobile|android|iphone/i.test(userAgent);
  const browserMatch = userAgent.match(/(chrome|firefox|safari|edge)\/?\s*(\d+)?/i);
  const browser = browserMatch ? browserMatch[1] : "Browser";
  return { label: `${browser} · ${isMobile ? "Mobile" : "Desktop"}`, isMobile };
}

export function SessionRow({ session }: { session: Session }) {
  const utils = trpc.useUtils();
  const device = parseDevice(session.userAgent);
  const Icon = device.isMobile ? Smartphone : Laptop;

  const revoke = trpc.auth.revokeSession.useMutation({
    onSuccess: () => {
      toast.success("Session revoked");
      void utils.auth.sessions.invalidate();
    },
    onError: (err) => toast.error(err.message || "Couldn't revoke this session"),
  });

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0 sm:px-5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">{device.label}</span>
          {session.isCurrent && <Badge variant="success">This device</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          {session.ip ? `${session.ip} · ` : ""}
          Signed in {formatDateTime(session.createdAt)}
        </p>
      </div>
      {!session.isCurrent && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => revoke.mutate({ sessionId: session.id })}
          loading={revoke.isPending}
        >
          Revoke
        </Button>
      )}
    </div>
  );
}
