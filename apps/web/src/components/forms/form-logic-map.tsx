"use client";

import Link from "next/link";
import { ArrowLeft, Workflow } from "lucide-react";
import { trpc } from "~/trpc/client";
import type { RouterOutputs } from "@formkit/trpc/client";
import { FIELD_TYPE_MAP } from "~/components/forms/field-types";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/dashboard/empty-state";
import { ErrorState } from "~/components/dashboard/error-state";

type FormField = RouterOutputs["forms"]["get"]["fields"][number];

const NODE_WIDTH = 340;
const ROW_HEIGHT = 60;
const ROW_GAP = 16;
const STEP = ROW_HEIGHT + ROW_GAP;
const LANE_START = 28;
const LANE_WIDTH = 26;
const LABEL_PAD = 132;

function nodeCenterY(index: number) {
  return index * STEP + ROW_HEIGHT / 2;
}

type Edge = {
  sourceIndex: number;
  targetIndex: number;
  sourceLabel: string;
  targetLabel: string;
  operator: "equals" | "not_equals";
  valueLabel: string;
};

function resolveConditionValueLabel(sourceField: FormField, value: string): string {
  if (sourceField.type === "yes_no") return value === "yes" ? "Yes" : "No";
  if (value === "other") return "Other";
  return sourceField.config?.options?.find((o) => o.id === value)?.label ?? value;
}

function buildEdges(fields: FormField[]): Edge[] {
  const indexById = new Map(fields.map((f, i) => [f.id, i]));
  const edges: Edge[] = [];

  fields.forEach((field, targetIndex) => {
    const condition = field.config?.conditionalLogic?.[0];
    if (!condition) return;
    const sourceIndex = indexById.get(condition.fieldId);
    if (sourceIndex === undefined) return; // referenced question was deleted
    const sourceField = fields[sourceIndex]!;
    edges.push({
      sourceIndex,
      targetIndex,
      sourceLabel: sourceField.label,
      targetLabel: field.label,
      operator: condition.operator,
      valueLabel: resolveConditionValueLabel(sourceField, condition.value),
    });
  });

  return edges;
}

/** Edges never cross (source is always earlier than target — enforced in
 * the builder), so overlap only happens when two edges' vertical spans
 * intersect. Greedy lane assignment: shortest spans first, each edge takes
 * the first lane whose existing spans don't overlap it. */
function assignLanes(edges: Edge[]): (Edge & { lane: number })[] {
  const bySpan = [...edges].sort(
    (a, b) => a.targetIndex - a.sourceIndex - (b.targetIndex - b.sourceIndex),
  );
  const lanes: { start: number; end: number }[][] = [];
  const result: (Edge & { lane: number })[] = [];

  for (const edge of bySpan) {
    const span = { start: edge.sourceIndex, end: edge.targetIndex };
    let lane = lanes.findIndex((occupied) =>
      occupied.every((r) => span.end < r.start || span.start > r.end),
    );
    if (lane === -1) {
      lane = lanes.length;
      lanes.push([]);
    }
    lanes[lane]!.push(span);
    result.push({ ...edge, lane });
  }

  return result;
}

function LogicNode({ field, index }: { field: FormField; index: number }) {
  const meta = FIELD_TYPE_MAP[field.type];
  const Icon = meta.icon;
  const hasCondition = !!field.config?.conditionalLogic?.length;

  return (
    <div
      style={{ height: ROW_HEIGHT, width: NODE_WIDTH }}
      className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 shadow-xs"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {index + 1}. {field.label}
        </p>
        <p className="text-xs text-muted-foreground">
          {meta.label}
          {field.required && " · Required"}
          {hasCondition && " · Conditional"}
        </p>
      </div>
    </div>
  );
}

function LogicDiagram({ fields }: { fields: FormField[] }) {
  const edges = buildEdges(fields);
  const lanedEdges = assignLanes(edges);
  const laneCount = Math.max(0, ...lanedEdges.map((e) => e.lane + 1));

  const svgWidth = NODE_WIDTH + LANE_START + laneCount * LANE_WIDTH + LABEL_PAD;
  const svgHeight = fields.length * STEP - ROW_GAP;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-muted/20 p-6">
      <div className="relative" style={{ width: svgWidth, height: svgHeight }}>
        <div className="absolute top-0 left-0 flex flex-col" style={{ gap: ROW_GAP }}>
          {fields.map((field, index) => (
            <LogicNode key={field.id} field={field} index={index} />
          ))}
        </div>

        <svg
          width={svgWidth}
          height={svgHeight}
          className="pointer-events-none absolute top-0 left-0 overflow-visible"
        >
          <defs>
            <marker id="logic-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="fill-primary" />
            </marker>
          </defs>

          {lanedEdges.map((edge, i) => {
            const sourceY = nodeCenterY(edge.sourceIndex);
            const targetY = nodeCenterY(edge.targetIndex);
            const laneX = NODE_WIDTH + LANE_START + edge.lane * LANE_WIDTH;
            const startX = NODE_WIDTH;
            const path = `M ${startX} ${sourceY} C ${laneX} ${sourceY} ${laneX} ${targetY} ${startX} ${targetY}`;
            const labelY = (sourceY + targetY) / 2;
            const opText = edge.operator === "not_equals" ? "is not" : "is";

            return (
              <g key={i}>
                <path d={path} className="fill-none stroke-primary/60" strokeWidth={1.5} markerEnd="url(#logic-arrow)" />
                <circle cx={startX} cy={sourceY} r={3} className="fill-primary" />
                <text
                  x={laneX + laneCount * 0 + 10}
                  y={labelY}
                  className="fill-muted-foreground text-[11px]"
                  dominantBaseline="middle"
                >
                  {opText} &ldquo;{edge.valueLabel}&rdquo;
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function FormLogicMap({ formId }: { formId: string }) {
  const query = trpc.forms.get.useQuery({ formId });

  if (query.isLoading) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="h-8 w-56 animate-shimmer bg-shimmer rounded-lg" />
        <div className="h-96 animate-shimmer bg-shimmer rounded-xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Couldn't load this form"
        description={query.error?.message}
        onRetry={() => query.refetch()}
      />
    );
  }

  const { title, fields } = query.data;
  const edgeCount = buildEdges(fields).length;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-4 animate-fade-up">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link href={`/forms/${formId}`}>
            <ArrowLeft className="size-4" />
            Back to editor
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Logic map — how skip logic connects your questions.
          </p>
        </div>
      </div>

      {fields.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="Nothing to map yet"
          description="Add a few questions in the editor to see them here."
        />
      ) : edgeCount === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No logic rules yet"
          description={`Open a question's settings in the editor and set "Show this question only if…" to create a rule — it'll show up here.`}
          action={
            <Button size="sm" asChild>
              <Link href={`/forms/${formId}`}>Go to editor</Link>
            </Button>
          }
        />
      ) : (
        <LogicDiagram fields={fields} />
      )}
    </div>
  );
}
