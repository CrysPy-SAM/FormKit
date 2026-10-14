"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilePlus2, FileText, LayoutTemplate, Search } from "lucide-react";
import { trpc } from "~/trpc/client";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { EmptyState } from "~/components/dashboard/empty-state";
import { ErrorState } from "~/components/dashboard/error-state";
import { FormRow, FormRowSkeleton } from "~/components/forms/form-row";

type StatusFilter = "all" | "draft" | "published" | "archived";

export default function FormsPage() {
  const formsQuery = trpc.forms.list.useQuery();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const forms = formsQuery.data;

  const filtered = useMemo(() => {
    return (forms ?? [])
      .filter((f) => status === "all" || f.status === status)
      .filter((f) => f.title.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [forms, status, query]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Forms</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, edit, and publish your forms.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" asChild>
            <Link href="/forms/templates">
              <LayoutTemplate className="size-4" />
              Browse templates
            </Link>
          </Button>
          <Button asChild>
            <Link href="/forms/new">
              <FilePlus2 className="size-4" />
              New form
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search forms…"
            className="pl-8"
          />
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        {formsQuery.isLoading ? (
          <div>
            <FormRowSkeleton />
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
        ) : filtered.length === 0 ? (
          <EmptyState
            className="border-0"
            icon={FileText}
            title={!forms?.length ? "No forms yet" : "No matching forms"}
            description={
              !forms?.length
                ? "Create your first form to start collecting responses."
                : "Try adjusting your search or filters."
            }
            action={
              !forms?.length ? (
                <div className="flex items-center gap-2">
                  <Button variant="secondary" asChild size="sm">
                    <Link href="/forms/templates">
                      <LayoutTemplate className="size-4" />
                      Browse templates
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/forms/new">
                      <FilePlus2 className="size-4" />
                      Create a form
                    </Link>
                  </Button>
                </div>
              ) : undefined
            }
          />
        ) : (
          <div>
            {filtered.map((form) => (
              <FormRow key={form.id} form={form} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
