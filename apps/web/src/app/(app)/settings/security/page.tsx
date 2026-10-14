"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { broadcastLogout } from "~/lib/auth-channel";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ErrorState } from "~/components/dashboard/error-state";
import { SessionRow } from "~/components/settings/session-row";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const sessionsQuery = trpc.auth.sessions.useQuery();

  const logoutAll = trpc.auth.logoutAllDevices.useMutation({
    onSuccess: () => {
      broadcastLogout();
      router.push("/login");
      router.refresh();
    },
    onError: (err) => toast.error(err.message || "Couldn't sign out everywhere"),
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Reset your password using a secure link sent to your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/forgot-password">
              <KeyRound className="size-4" />
              Send password reset link
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden p-0">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border p-6">
          <div>
            <CardTitle>Active sessions</CardTitle>
            <CardDescription>Devices currently signed in to your account.</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => logoutAll.mutate()}
            loading={logoutAll.isPending}
          >
            <LogOut className="size-4" />
            Sign out everywhere
          </Button>
        </CardHeader>

        {sessionsQuery.isLoading ? (
          <div className="p-6">
            <div className="h-12 animate-shimmer bg-shimmer rounded-lg" />
          </div>
        ) : sessionsQuery.isError ? (
          <ErrorState
            className="border-0"
            description={sessionsQuery.error.message}
            onRetry={() => sessionsQuery.refetch()}
          />
        ) : !sessionsQuery.data?.length ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
            <MonitorSmartphone className="size-5" />
            No active sessions found.
          </div>
        ) : (
          <div>
            {sessionsQuery.data.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
