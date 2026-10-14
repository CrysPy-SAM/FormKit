"use client";

import Link from "next/link";
import { ArrowLeft, Download, FileDown, Inbox, Mail } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { formatDateTime } from "~/lib/format";
import { exportResponsesAsCsv, exportResponsesAsPdf } from "~/lib/export-responses";
import { downloadResponseFile, type UploadedFile } from "~/lib/uploads";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/dashboard/empty-state";
import { ErrorState } from "~/components/dashboard/error-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

function formatAnswerValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return String(value);
}

function isUploadedFileValue(value: unknown): value is UploadedFile {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "filename" in value &&
    typeof (value as UploadedFile).filename === "string"
  );
}

function AnswerValue({ formId, responseId, fieldId, value }: { formId: string; responseId: string; fieldId: string; value: unknown }) {
  if (isUploadedFileValue(value)) {
    return (
      <button
        type="button"
        onClick={() =>
          downloadResponseFile(formId, responseId, fieldId).catch((err) =>
            toast.error(err instanceof Error ? err.message : "Couldn't download the file"),
          )
        }
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <FileDown className="size-3.5" />
        {value.filename}
      </button>
    );
  }
  return <span className="text-sm text-foreground">{formatAnswerValue(value)}</span>;
}

export function FormResponses({ formId }: { formId: string }) {
  const query = trpc.forms.responses.useQuery({ formId });

  if (query.isLoading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="h-8 w-56 animate-shimmer bg-shimmer rounded-lg" />
        <div className="h-32 animate-shimmer bg-shimmer rounded-xl" />
        <div className="h-32 animate-shimmer bg-shimmer rounded-xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Couldn't load responses"
        description={query.error?.message}
        onRetry={() => query.refetch()}
      />
    );
  }

  const data = query.data;
  const { formTitle, total, responses } = data;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-4 animate-fade-up">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link href={`/forms/${formId}`}>
            <ArrowLeft className="size-4" />
            Back to editor
          </Link>
        </Button>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{formTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Responses</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="accent">
              {total} {total === 1 ? "response" : "responses"}
            </Badge>
            {total > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm">
                    <Download className="size-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportResponsesAsCsv(data)}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportResponsesAsPdf(data)}>
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {responses.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No responses yet"
          description="Share your form's public link to start collecting responses."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {responses.map((response) => (
            <Card key={response.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <span className="text-xs text-muted-foreground">
                  {response.completedAt ? formatDateTime(response.completedAt) : "In progress"}
                </span>
                {response.respondentEmail && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="size-3.5" />
                    {response.respondentEmail}
                  </span>
                )}
              </div>
              <dl className="mt-3 flex flex-col gap-3">
                {response.answers.map((answer) => (
                  <div key={answer.fieldId}>
                    <dt className="text-xs text-muted-foreground">{answer.label}</dt>
                    <dd className="mt-0.5">
                      <AnswerValue formId={formId} responseId={response.id} fieldId={answer.fieldId} value={answer.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
