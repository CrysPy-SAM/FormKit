"use client";

import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { FormStatusBadge } from "~/components/forms/status-badge";
import { ErrorState } from "~/components/dashboard/error-state";
import { EmptyState } from "~/components/dashboard/empty-state";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { resolveFormTheme, getThemeCssVars } from "~/lib/form-theme";
import { StepForm } from "~/components/public/step-form";

export function FormPreview({ formId }: { formId: string }) {
  const formQuery = trpc.forms.get.useQuery({ formId });

  if (formQuery.isLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="h-8 w-48 animate-shimmer bg-shimmer rounded-lg" />
        <div className="h-64 animate-shimmer bg-shimmer rounded-xl" />
      </div>
    );
  }

  if (formQuery.isError || !formQuery.data) {
    return (
      <ErrorState
        title="Couldn't load this form"
        description={formQuery.error?.message}
        onRetry={() => formQuery.refetch()}
      />
    );
  }

  const form = formQuery.data;
  // Draft theme — the same one the owner is currently editing, not
  // necessarily what's already published (see publish flow: only publishing
  // freezes the current theme into the live snapshot).
  const theme = resolveFormTheme(form.theme);
  const cssVars = getThemeCssVars(theme);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between animate-fade-up">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/forms/${formId}`}>
            <ArrowLeft className="size-4" />
            Back to editor
          </Link>
        </Button>
        <FormStatusBadge status={form.status} />
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground animate-fade-up">
        <Eye className="size-4 shrink-0" />
        This is a preview with your current theme and questions. Responses aren&apos;t recorded here.
      </div>

      {form.fields.length === 0 ? (
        <Card className="p-6 sm:p-10">
          <h1 className="font-serif text-2xl text-foreground sm:text-3xl">{form.title}</h1>
          <EmptyState
            className="mt-8 border-0 py-10"
            icon={Eye}
            title="Nothing to preview yet"
            description="Add a few questions in the editor to see them here."
          />
        </Card>
      ) : (
        <div style={cssVars} className="rounded-2xl bg-background font-sans text-foreground">
          <Card className="p-6 sm:p-10 animate-fade-up">
            <h1 className="mb-8 font-serif text-2xl text-foreground sm:text-3xl">{form.title}</h1>
            <StepForm
              key={formId}
              fields={form.fields}
              progressStyle={theme.progressStyle}
              submitLabel="Submit"
              onComplete={() => toast.success("Looks good! This preview doesn't save a response.")}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
