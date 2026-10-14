"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, HelpCircle, Inbox, ListChecks } from "lucide-react";
import type { RouterOutputs } from "@formkit/trpc/client";
import { trpc } from "~/trpc/client";
import { formatDate } from "~/lib/format";
import { FIELD_TYPE_MAP } from "~/components/forms/field-types";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/dashboard/empty-state";
import { ErrorState } from "~/components/dashboard/error-state";
import { StatCard, StatCardSkeleton } from "~/components/dashboard/stat-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

type Analytics = RouterOutputs["forms"]["analytics"];
type FieldAnalytics = Analytics["fields"][number];

function UnavailableStat({ label, reason }: { label: string; reason: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label={`Why is ${label} unavailable?`} className="text-muted-foreground/70 hover:text-muted-foreground">
              <HelpCircle className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-56 text-pretty">{reason}</TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-muted-foreground">Not available</div>
    </Card>
  );
}

function TrendChart({ trend }: { trend: Analytics["trend"] }) {
  const max = Math.max(1, ...trend.map((t) => t.count));
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-foreground">Responses over time</h2>
      <div className="mt-5 flex h-40 items-end gap-1.5 overflow-x-auto pb-1">
        {trend.map((point) => (
          <Tooltip key={point.date}>
            <TooltipTrigger asChild>
              <div className="flex h-full min-w-[10px] flex-1 flex-col items-center justify-end gap-1.5">
                <div
                  className="w-full min-w-[6px] rounded-t-sm bg-primary transition-all hover:bg-primary-hover"
                  style={{ height: `${Math.max(4, (point.count / max) * 100)}%` }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {formatDate(point.date)} · {point.count} {point.count === 1 ? "response" : "responses"}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{formatDate(trend[0]!.date)}</span>
        {trend.length > 1 && <span>{formatDate(trend[trend.length - 1]!.date)}</span>}
      </div>
    </Card>
  );
}

function OptionBars({
  options,
  percentageLabel,
}: {
  options: NonNullable<FieldAnalytics["options"]>;
  percentageLabel: string;
}) {
  const topCount = Math.max(0, ...options.map((o) => o.count));
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((option) => (
        <div key={option.id}>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-foreground">{option.label}</span>
            <span className="shrink-0 text-muted-foreground">
              {option.count} · {Math.round(option.percentage * 100)}% {percentageLabel}
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: option.count === topCount && topCount > 0 ? "100%" : `${(option.count / (topCount || 1)) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RatingDistribution({ average, distribution }: { average: number | null; distribution: NonNullable<FieldAnalytics["distribution"]> }) {
  const max = Math.max(1, ...distribution.map((d) => d.count));
  return (
    <div className="flex items-center gap-6">
      <div className="shrink-0 text-center">
        <div className="text-3xl font-semibold tracking-tight text-foreground">
          {average !== null ? average.toFixed(1) : "—"}
        </div>
        <div className="text-xs text-muted-foreground">avg. of 5</div>
      </div>
      <div className="flex flex-1 items-end gap-2">
        {distribution.map((d) => (
          <div key={d.value} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-16 w-full items-end">
              <div
                className="w-full rounded-t-sm bg-primary/80"
                style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? "4px" : 0 }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">{d.value}★</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldAnalyticsCard({ field }: { field: FieldAnalytics }) {
  const meta = FIELD_TYPE_MAP[field.type];
  const Icon = meta.icon;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-3.5" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">{field.label}</p>
            <p className="text-xs text-muted-foreground">{meta.label}</p>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0">
          {field.answered} answered · {Math.round(field.answerRate * 100)}%
        </Badge>
      </div>

      <div className="mt-4">
        {field.type === "rating" && field.distribution ? (
          <RatingDistribution average={field.average ?? null} distribution={field.distribution} />
        ) : field.type === "number" ? (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-semibold text-foreground">{field.average?.toFixed(1) ?? "—"}</div>
              <div className="text-xs text-muted-foreground">average</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">{field.min ?? "—"}</div>
              <div className="text-xs text-muted-foreground">min</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">{field.max ?? "—"}</div>
              <div className="text-xs text-muted-foreground">max</div>
            </div>
          </div>
        ) : field.options && field.options.length > 0 ? (
          <OptionBars
            options={field.options}
            percentageLabel={field.type === "checkbox" ? "of respondents" : "of answers"}
          />
        ) : field.answered === 0 ? (
          <p className="text-xs text-muted-foreground">No answers yet for this question.</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {field.type === "file_upload" ? "Uploaded files aren't" : "Free-text answers aren't"}{" "}
            summarized here — view them individually on the{" "}
            <span className="text-foreground">Responses</span> page.
          </p>
        )}
      </div>
    </Card>
  );
}

export function FormAnalytics({ formId }: { formId: string }) {
  const query = trpc.forms.analytics.useQuery({ formId });
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  if (query.isLoading) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="h-8 w-56 animate-shimmer bg-shimmer rounded-lg" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="h-56 animate-shimmer bg-shimmer rounded-xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Couldn't load analytics"
        description={query.error?.message}
        onRetry={() => query.refetch()}
      />
    );
  }

  const { formTitle, total, totalFields, averageAnsweredFields, trend, fields } = query.data;
  const visibleFields = showAllQuestions ? fields : fields.slice(0, 6);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-4 animate-fade-up">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link href={`/forms/${formId}`}>
            <ArrowLeft className="size-4" />
            Back to editor
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{formTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Analytics</p>
          </div>
          <Badge variant="accent">
            {total} {total === 1 ? "response" : "responses"}
          </Badge>
        </div>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No responses yet"
          description="Once people start filling out your form, insights will show up here."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total responses" value={total} icon={Inbox} />
            <StatCard
              label="Avg. questions answered"
              value={averageAnsweredFields !== null ? `${averageAnsweredFields.toFixed(1)} / ${totalFields}` : "—"}
              icon={ListChecks}
              hint="per completed response"
            />
            <UnavailableStat
              label="Completion rate"
              reason="Every stored response is already a finished submission — this app doesn't record visitors who opened the form and left, so starts-vs-finishes can't be measured yet."
            />
            <UnavailableStat
              label="Avg. completion time"
              reason="A response is only saved once, at final submit — there's no separate 'started filling this out' timestamp to measure time spent against."
            />
          </div>

          <TrendChart trend={trend} />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Question breakdown</h2>
              {fields.length > 6 && (
                <Button variant="ghost" size="sm" onClick={() => setShowAllQuestions((v) => !v)}>
                  {showAllQuestions ? "Show fewer" : `Show all ${fields.length}`}
                </Button>
              )}
            </div>
            {visibleFields.map((field) => (
              <FieldAnalyticsCard key={field.fieldId} field={field} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
