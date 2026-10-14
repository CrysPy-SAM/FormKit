"use client";

import { Building2, Crown, Users } from "lucide-react";
import { trpc } from "~/trpc/client";
import { useWorkspace } from "~/providers/workspace";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ErrorState } from "~/components/dashboard/error-state";
import { EmptyState } from "~/components/dashboard/empty-state";
import { CreateTeamDialog } from "~/components/settings/create-team-dialog";

const LIMIT_LABELS: { key: "maxForms" | "maxTeams" | "maxOrgMembers" | "maxTeamMembers"; label: string }[] = [
  { key: "maxForms", label: "Forms" },
  { key: "maxTeams", label: "Teams" },
  { key: "maxOrgMembers", label: "Org members" },
  { key: "maxTeamMembers", label: "Members per team" },
];

function formatLimit(value: number) {
  return value === -1 ? "Unlimited" : value.toLocaleString();
}

export default function WorkspaceSettingsPage() {
  const { activeOrg } = useWorkspace();
  const teamsQuery = trpc.workspace.list.useQuery();
  const subscriptionQuery = trpc.workspace.getSubscription.useQuery();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>General information about this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Building2 className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{activeOrg?.name}</p>
              <p className="text-xs text-muted-foreground">/{activeOrg?.slug}</p>
            </div>
            {activeOrg?.isPersonal && <Badge className="ml-auto">Personal</Badge>}
            {activeOrg?.role === "OWNER" && (
              <Badge variant="accent" className="ml-auto">
                <Crown className="size-3" />
                Owner
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan &amp; usage</CardTitle>
          <CardDescription>Current plan limits for this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionQuery.isLoading ? (
            <div className="h-20 animate-shimmer bg-shimmer rounded-lg" />
          ) : subscriptionQuery.isError ? (
            <ErrorState
              className="py-8"
              description={subscriptionQuery.error.message}
              onRetry={() => subscriptionQuery.refetch()}
            />
          ) : subscriptionQuery.data ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="accent" className="capitalize">
                  {subscriptionQuery.data.planName}
                </Badge>
                <span className="text-xs text-muted-foreground capitalize">
                  {subscriptionQuery.data.status}
                </span>
                {subscriptionQuery.data.limits.customBranding && (
                  <Badge variant="outline">Custom branding</Badge>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {LIMIT_LABELS.map(({ key, label }) => (
                  <div key={key}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-foreground">
                      {formatLimit(subscriptionQuery.data.limits[key])}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden p-0">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border p-6">
          <div>
            <CardTitle>Teams</CardTitle>
            <CardDescription>Scope forms and access to specific teams.</CardDescription>
          </div>
          <CreateTeamDialog trigger={<Button size="sm">New team</Button>} />
        </CardHeader>

        {teamsQuery.isLoading ? (
          <div className="p-6">
            <div className="h-12 animate-shimmer bg-shimmer rounded-lg" />
          </div>
        ) : teamsQuery.isError ? (
          <ErrorState
            className="border-0"
            description={teamsQuery.error.message}
            onRetry={() => teamsQuery.refetch()}
          />
        ) : !teamsQuery.data?.length ? (
          <EmptyState
            className="border-0"
            icon={Users}
            title="No teams yet"
            description="Create a team to scope forms and access to a subset of your workspace."
          />
        ) : (
          <div>
            {teamsQuery.data.map((team) => (
              <div
                key={team.id}
                className="flex items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Users className="size-4" />
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">{team.name}</span>
                <span className="text-xs text-muted-foreground">
                  {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
