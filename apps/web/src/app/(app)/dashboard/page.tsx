"use client";

import Link from "next/link";
import { FileText, FilePlus2, Rocket, Users } from "lucide-react";
import { trpc } from "~/trpc/client";
import { useMe } from "~/hooks/use-me";
import { useWorkspace } from "~/providers/workspace";
import { StatCard, StatCardSkeleton } from "~/components/dashboard/stat-card";
import { EmptyState } from "~/components/dashboard/empty-state";
import { ErrorState } from "~/components/dashboard/error-state";
import { Card, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FormRow, FormRowSkeleton } from "~/components/forms/form-row";

export default function DashboardPage() {
  const { data: me } = useMe();
  const { activeOrg } = useWorkspace();
  const formsQuery = trpc.forms.list.useQuery();
  const teamsQuery = trpc.workspace.list.useQuery();

  const firstName = me?.name?.split(" ")[0];
  const forms = formsQuery.data ?? [];
  const published = forms.filter((f) => f.status === "published").length;
  const drafts = forms.filter((f) => f.status === "draft").length;
  const recentForms = [...forms]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-1 animate-fade-up">
        <h1 className="font-serif text-2xl text-foreground sm:text-3xl">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening in {activeOrg?.name ?? "your workspace"}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {formsQuery.isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total forms" value={forms.length} icon={FileText} />
            <StatCard label="Published" value={published} icon={Rocket} />
            <StatCard label="Drafts" value={drafts} icon={FilePlus2} />
            <StatCard
              label="Teams"
              value={teamsQuery.data?.length ?? 0}
              icon={Users}
            />
          </>
        )}
      </div>

      <Card className="overflow-hidden p-0">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border">
          <div>
            <CardTitle>Recent forms</CardTitle>
            <CardDescription>Your most recently created forms</CardDescription>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/forms">View all</Link>
          </Button>
        </CardHeader>

        {formsQuery.isLoading ? (
          <div>
            <FormRowSkeleton />
            <FormRowSkeleton />
            <FormRowSkeleton />
          </div>
        ) : formsQuery.isError ? (
          <ErrorState
            className="border-0"
            description={formsQuery.error.message}
            onRetry={() => formsQuery.refetch()}
          />
        ) : recentForms.length === 0 ? (
          <EmptyState
            className="border-0"
            icon={FileText}
            title="No forms yet"
            description="Create your first form to start collecting responses."
            action={
              <Button asChild size="sm">
                <Link href="/forms/new">
                  <FilePlus2 className="size-4" />
                  Create a form
                </Link>
              </Button>
            }
          />
        ) : (
          <div>
            {recentForms.map((form) => (
              <FormRow key={form.id} form={form} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
