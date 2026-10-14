"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { RouterOutputs } from "@formkit/trpc/client";
import { FIELD_TYPE_MAP } from "~/components/forms/field-types";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

type FormField = RouterOutputs["forms"]["get"]["fields"][number];

export function SortableFieldCard({
  field,
  index,
  isSelected,
  onSelect,
  onDelete,
}: {
  field: FormField;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const meta = FIELD_TYPE_MAP[field.type];
  const Icon = meta.icon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "group flex items-start gap-3 rounded-xl border bg-card p-4 shadow-xs transition-colors cursor-pointer",
        isSelected ? "border-primary ring-1 ring-primary" : "border-border hover:border-foreground/20",
        isDragging && "z-10 opacity-70 shadow-lg",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="mt-0.5 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>

      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-3.5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{index + 1}</span>
          <span>·</span>
          <span>{meta.label}</span>
          {field.required && (
            <>
              <span>·</span>
              <span className="text-primary">Required</span>
            </>
          )}
          {!!field.config?.conditionalLogic?.length && (
            <>
              <span>·</span>
              <span>Conditional</span>
            </>
          )}
        </div>
        <p className="mt-1 truncate text-sm font-medium text-foreground">{field.label}</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Delete field"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
