"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { FilePlus2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import type { RouterOutputs } from "@formkit/trpc/client";
import type { FieldType } from "~/components/forms/field-types";
import { FieldPalette } from "~/components/forms/field-palette";
import { SortableFieldCard } from "~/components/forms/sortable-field-card";
import { FieldInspector } from "~/components/forms/field-inspector";
import { FormBuilderTopbar } from "~/components/forms/form-builder-topbar";
import { EmptyState } from "~/components/dashboard/empty-state";
import { ErrorState } from "~/components/dashboard/error-state";
import { Card } from "~/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { useMediaQuery } from "~/hooks/use-media-query";

type FormWithFields = RouterOutputs["forms"]["get"];
type FormField = FormWithFields["fields"][number];

export function FormBuilder({ formId }: { formId: string }) {
  const utils = trpc.useUtils();
  const formQuery = trpc.forms.get.useQuery({ formId });

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const fields = formQuery.data?.fields ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const createField = trpc.forms.fields.create.useMutation({
    onSuccess: (field) => {
      setSelectedFieldId(field.id);
      void utils.forms.get.invalidate({ formId });
    },
    onError: (err) => toast.error(err.message || "Couldn't add that field"),
  });

  const updateField = trpc.forms.fields.update.useMutation({
    onError: (err) => toast.error(err.message || "Couldn't save changes"),
    onSettled: () => void utils.forms.get.invalidate({ formId }),
  });

  const deleteField = trpc.forms.fields.delete.useMutation({
    onSuccess: () => void utils.forms.get.invalidate({ formId }),
    onError: (err) => toast.error(err.message || "Couldn't delete that field"),
  });

  function handleAddField(type: FieldType) {
    createField.mutate({
      formId,
      type,
      label: "Untitled question",
      order: fields.length,
      required: false,
    });
  }

  function handleDeleteField(field: FormField) {
    if (!window.confirm(`Delete "${field.label}"? This can't be undone.`)) return;
    if (selectedFieldId === field.id) setSelectedFieldId(null);
    deleteField.mutate({ formId, fieldId: field.id });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(fields, oldIndex, newIndex).map((field, index) => ({
      ...field,
      order: index,
    }));

    // Optimistically reorder in the query cache so the drag feels instant;
    // onSettled below reconciles with the server once each PATCH resolves.
    utils.forms.get.setData({ formId }, (current) =>
      current ? { ...current, fields: reordered } : current,
    );

    reordered.forEach((field, index) => {
      const original = fields.find((f) => f.id === field.id);
      if (original && original.order !== index) {
        updateField.mutate({ formId, fieldId: field.id, order: index });
      }
    });
  }

  if (formQuery.isLoading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="h-9 w-64 animate-shimmer bg-shimmer rounded-lg" />
        <div className="h-40 animate-shimmer bg-shimmer rounded-xl" />
        <div className="h-40 animate-shimmer bg-shimmer rounded-xl" />
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
  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null;

  return (
    <div className="-mx-4 -my-6 flex flex-col sm:-mx-6 lg:-mx-8">
      <FormBuilderTopbar form={form} />

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr_300px] lg:px-8">
        <div className="hidden lg:block">
          <div className="sticky top-32">
            <FieldPalette onAdd={handleAddField} disabled={createField.isPending} />
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <FieldPaletteMobile onAdd={handleAddField} disabled={createField.isPending} />
          </div>

          {fields.length === 0 ? (
            <EmptyState
              icon={FilePlus2}
              title="Start building your form"
              description="Add a question from the panel to get started."
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-3">
                  {fields.map((field, index) => (
                    <SortableFieldCard
                      key={field.id}
                      field={field}
                      index={index}
                      isSelected={field.id === selectedFieldId}
                      onSelect={() => setSelectedFieldId(field.id)}
                      onDelete={() => handleDeleteField(field)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-32">
            {selectedField ? (
              <Card className="p-4">
                <FieldInspector
                  key={selectedField.id}
                  field={selectedField}
                  allFields={fields}
                  onUpdate={(patch) =>
                    updateField.mutate({ formId, fieldId: selectedField.id, ...patch })
                  }
                />
              </Card>
            ) : (
              <Card className="flex flex-col items-center justify-center gap-1 p-6 text-center">
                <p className="text-sm font-medium text-foreground">No field selected</p>
                <p className="text-xs text-muted-foreground">
                  Select a question to edit its settings.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={!isDesktop && !!selectedField}
        onOpenChange={(open) => !open && setSelectedFieldId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Question settings</DialogTitle>
          </DialogHeader>
          {selectedField && (
            <FieldInspector
              key={selectedField.id}
              field={selectedField}
              allFields={fields}
              onUpdate={(patch) =>
                updateField.mutate({ formId, fieldId: selectedField.id, ...patch })
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FieldPaletteMobile({
  onAdd,
  disabled,
}: {
  onAdd: (type: FieldType) => void;
  disabled?: boolean;
}) {
  return (
    <Card className="w-full p-3">
      <FieldPalette onAdd={onAdd} disabled={disabled} />
    </Card>
  );
}
