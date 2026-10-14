"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, FormProvider } from "react-hook-form";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "~/lib/utils";
import { buildPublicFormSchema, defaultValuesFor, isFieldVisible, type PublicField } from "~/lib/public-form-schema";
import type { ResolvedFormTheme } from "~/lib/form-theme";
import { PublicFieldInput, isAutoAdvanceType } from "~/components/public/public-field-input";
import { Button } from "~/components/ui/button";

export function StepProgress({
  current,
  total,
  style = "bar",
}: {
  current: number;
  total: number;
  style?: ResolvedFormTheme["progressStyle"];
}) {
  if (style === "none" || total === 0) return null;
  const pct = Math.round(((current + 1) / total) * 100);

  if (style === "steps") {
    return (
      <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === current ? "w-6 bg-primary" : i < current ? "w-1.5 bg-primary/50" : "w-1.5 bg-border",
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Question ${current + 1} of ${total}`}
      className="h-1.5 w-full overflow-hidden rounded-full bg-border"
    >
      <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StepForm({
  fields,
  onComplete,
  isSubmitting = false,
  submitLabel = "Submit",
  progressStyle = "bar",
  onStepChange,
  slug,
}: {
  fields: PublicField[];
  onComplete: (values: Record<string, unknown>) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  progressStyle?: ResolvedFormTheme["progressStyle"];
  onStepChange?: (index: number, total: number) => void;
  /** The published form's public slug — file_upload fields need it to know
   * where to upload to. Omitted in draft/preview contexts, where a real
   * upload can't happen yet (the field shows a "publish first" notice). */
  slug?: string;
}) {
  const schema = useMemo(() => buildPublicFormSchema(fields), [fields]);
  const formValues = useMemo(() => defaultValuesFor(fields), [fields]);
  const form = useForm({ resolver: zodResolver(schema), values: formValues });
  const [uploading, setUploading] = useState(false);

  // Callers key StepForm by something identifying "which form" (slug/formId)
  // so a genuinely different field list remounts this component fresh,
  // rather than resetting step state reactively from an effect.
  const [stepIndex, setStepIndex] = useState(0);
  const stepRef = useRef<HTMLDivElement>(null);

  // Recomputed on every answer change so a field whose visibility depends on
  // an earlier answer appears/disappears from the step sequence live. Skip
  // logic can only reference an earlier field (enforced in the builder), so
  // this never invalidates a step the respondent has already passed.
  const watchedValues = useWatch({ control: form.control });
  const visibleFields = useMemo(
    () => fields.filter((field) => isFieldVisible(field, watchedValues)),
    [fields, watchedValues],
  );

  const total = visibleFields.length;
  const currentField = visibleFields[stepIndex];
  const isLastStep = stepIndex === total - 1;

  useEffect(() => {
    onStepChange?.(stepIndex, total);
    const el = stepRef.current?.querySelector<HTMLElement>("[data-step-input]");
    el?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  async function goNext() {
    if (!currentField) return;
    if (currentField.type !== "statement") {
      const valid = await form.trigger(currentField.id);
      if (!valid) return;
    }
    if (isLastStep) {
      void form.handleSubmit((values) => onComplete(values))();
    } else {
      setStepIndex((i) => Math.min(i + 1, total - 1));
    }
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON") return;
    e.preventDefault();
    void goNext();
  }

  if (!currentField) return null;

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-6">
        <StepProgress current={stepIndex} total={total} style={progressStyle} />
        {progressStyle !== "none" && (
          <p className="-mt-3 text-xs text-muted-foreground" aria-live="polite">
            Question {stepIndex + 1} of {total}
          </p>
        )}

        <div ref={stepRef} key={currentField.id} onKeyDown={handleKeyDown} className="animate-fade-up">
          <PublicFieldInput
            field={currentField}
            slug={slug}
            onAutoAdvance={isAutoAdvanceType(currentField.type) ? () => setTimeout(goNext, 350) : undefined}
            onUploadingChange={setUploading}
          />
        </div>

        <div className="flex items-center gap-3">
          {stepIndex > 0 && (
            <Button type="button" variant="secondary" onClick={goBack} disabled={isSubmitting}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}
          <Button type="button" onClick={goNext} loading={isLastStep && isSubmitting} disabled={uploading}>
            {uploading ? "Uploading…" : isLastStep ? submitLabel : "Continue"}
            {!isLastStep && !uploading && <ArrowRight className="size-4" />}
          </Button>
          {!isLastStep && (
            <span className="hidden text-xs text-muted-foreground sm:inline">press Enter ↵</span>
          )}
        </div>
      </div>
    </FormProvider>
  );
}
