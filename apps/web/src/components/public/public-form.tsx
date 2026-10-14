"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, FileQuestion } from "lucide-react";
import { trpc } from "~/trpc/client";
import { Logo } from "~/components/logo";
import { Card } from "~/components/ui/card";
import { resolveFormTheme, getThemeCssVars } from "~/lib/form-theme";
import { StepForm } from "~/components/public/step-form";

// Must match FORM_CLOSED_MESSAGE in packages/services/src/forms/public.ts.
const FORM_CLOSED_ERROR_MESSAGE = "This form is no longer accepting responses.";

export function PublicForm({ slug }: { slug: string }) {
  const formQuery = trpc.forms.public.get.useQuery({ slug }, { retry: false });
  const submit = trpc.forms.public.submit.useMutation();

  const theme = resolveFormTheme(formQuery.data?.theme);
  const cssVars = getThemeCssVars(theme);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [theme.logoUrl]);

  const isClosed = formQuery.error?.message === FORM_CLOSED_ERROR_MESSAGE;

  function onComplete(values: Record<string, unknown>) {
    submit.mutate({ slug, answers: values });
  }

  return (
    <div
      style={cssVars}
      className="flex min-h-svh flex-col bg-background font-sans text-foreground"
    >
      <header className="flex items-center justify-center border-b border-border/70 bg-background px-6 py-4">
        {theme.logoUrl && !logoError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={theme.logoUrl}
            alt=""
            className="h-8 object-contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <Logo />
        )}
      </header>

      <main
        className={
          theme.layout === "full-bleed"
            ? "flex flex-1 items-start justify-center px-4 py-10 sm:py-16"
            : "flex flex-1 items-center justify-center px-4 py-10 sm:py-16"
        }
      >
        <div className="w-full max-w-2xl">
          {formQuery.isLoading ? (
            <Card className="p-8">
              <div className="flex flex-col gap-4">
                <div className="h-7 w-2/3 animate-shimmer bg-shimmer rounded-lg" />
                <div className="h-24 animate-shimmer bg-shimmer rounded-lg" />
                <div className="h-24 animate-shimmer bg-shimmer rounded-lg" />
              </div>
            </Card>
          ) : formQuery.isError || !formQuery.data ? (
            isClosed ? (
              <Card className="flex flex-col items-center gap-3 p-10 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Clock className="size-5" />
                </div>
                <h1 className="text-lg font-semibold text-foreground">This form is closed</h1>
                <p className="max-w-sm text-sm text-muted-foreground">{FORM_CLOSED_ERROR_MESSAGE}</p>
              </Card>
            ) : (
              <Card className="flex flex-col items-center gap-3 p-10 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <FileQuestion className="size-5" />
                </div>
                <h1 className="text-lg font-semibold text-foreground">This form isn&apos;t available</h1>
                <p className="max-w-sm text-sm text-muted-foreground">
                  It may have been unpublished, or the link might be incorrect.
                </p>
              </Card>
            )
          ) : submit.isSuccess ? (
            <Card className="flex flex-col items-center gap-3 p-10 text-center animate-fade-up">
              <div className="flex size-11 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="size-5" />
              </div>
              <h1 className="text-lg font-semibold text-foreground">Thanks for your response!</h1>
              <p className="max-w-sm text-sm text-muted-foreground">
                Your answers have been recorded.
              </p>
            </Card>
          ) : (
            <Card className="p-6 sm:p-10 animate-fade-up">
              <h1 className="mb-8 font-serif text-2xl text-foreground sm:text-3xl">
                {formQuery.data.title}
              </h1>

              <StepForm
                key={slug}
                fields={formQuery.data.fields}
                onComplete={onComplete}
                isSubmitting={submit.isPending}
                progressStyle={theme.progressStyle}
                slug={slug}
              />

              {submit.isError && (
                <p className="mt-4 text-sm font-medium text-destructive">{submit.error.message}</p>
              )}
            </Card>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Powered by <span className="font-medium text-foreground">FormKit</span>
          </p>
        </div>
      </main>
    </div>
  );
}
