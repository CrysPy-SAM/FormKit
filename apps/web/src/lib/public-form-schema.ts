import { z } from "zod";
import type { RouterOutputs } from "@formkit/trpc/client";

export type PublicForm = RouterOutputs["forms"]["public"]["get"];
export type PublicField = PublicForm["fields"][number];

/**
 * Client-side mirror of the backend's per-field visibility check
 * (packages/services/src/forms/public.ts, isFieldVisible) — for immediate
 * UX only (skipping steps, not blocking on hidden required fields). The
 * server re-evaluates this independently and is the actual source of truth.
 */
export function isFieldVisible(field: PublicField, values: Record<string, unknown>): boolean {
  const conditions = field.config?.conditionalLogic;
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((condition) => {
    const actual = values[condition.fieldId];
    return condition.operator === "not_equals" ? actual !== condition.value : actual === condition.value;
  });
}

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  return Array.isArray(value) && value.length === 0;
}

/** `.optional()` alone only exempts `undefined` — but every text-ish field
 * defaults to `""` (see defaultValuesFor), and several base validators
 * (email/url/date/select/radio) reject "" outright. Without this, an
 * untouched optional field — or a conditionally-hidden one, which is always
 * optional at the shape level regardless of `required` — would fail
 * validation and silently block Continue/Submit. Converting "" to
 * `undefined` first makes `.optional()` actually behave as "not answered". */
function optionalField(schema: z.ZodType): z.ZodType {
  return z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
}

/**
 * Client-side mirror of the backend's per-field validation
 * (packages/services/src/forms/public.ts, buildAnswerSchema) — for
 * immediate UX only. The server re-validates everything independently and
 * is the actual source of truth.
 *
 * A field with conditional logic is kept optional at the shape level, with
 * its "required" check added dynamically via `superRefine` instead — so it's
 * only enforced while the field is actually visible, whether checked
 * per-step (`form.trigger`) or on final submit (`form.handleSubmit`, which
 * validates every field, not just the current step). Fields without
 * conditional logic keep the original, simpler required-at-the-shape
 * behavior unchanged.
 */
export function buildPublicFormSchema(fields: PublicField[]) {
  const shape: Record<string, z.ZodType> = {};
  const conditionalRequiredFields: PublicField[] = [];

  for (const field of fields) {
    if (field.type === "statement") continue;

    const options = field.config?.options ?? [];
    const optionIds = new Set(options.map((o) => o.id));
    if (field.config?.allowOther) optionIds.add("other");

    let schema: z.ZodType;

    switch (field.type) {
      case "email":
        schema = z.email("Enter a valid email");
        break;
      case "url":
        schema = z.url("Enter a valid URL");
        break;
      case "number": {
        let num = z.coerce.number({ error: "Enter a number" });
        if (field.config?.validation?.min !== undefined) num = num.min(field.config.validation.min);
        if (field.config?.validation?.max !== undefined) num = num.max(field.config.validation.max);
        schema = num;
        break;
      }
      case "rating":
        schema = z.coerce.number().int().min(1).max(5);
        break;
      case "date":
        schema = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date");
        break;
      case "select":
      case "radio":
        schema = z.string().refine((v) => optionIds.has(v), "Choose an option");
        break;
      case "yes_no":
        schema = z.enum(["yes", "no"]);
        break;
      case "checkbox": {
        let arr = z.array(z.string()).refine(
          (values) => values.every((v) => optionIds.has(v)),
          "Choose a valid option",
        );
        if (field.config?.validation?.minSelections !== undefined) {
          const min = field.config.validation.minSelections;
          arr = arr.refine((v) => v.length >= min, `Choose at least ${min}`);
        }
        if (field.config?.validation?.maxSelections !== undefined) {
          const max = field.config.validation.maxSelections;
          arr = arr.refine((v) => v.length <= max, `Choose at most ${max}`);
        }
        schema = arr;
        break;
      }
      case "file_upload":
        // The field holds the metadata object returned by the upload
        // endpoint once a file's actually been uploaded (see
        // ~/lib/uploads.ts) — mirrors the server's buildAnswerSchema.
        schema = z.object({
          id: z.string(),
          filename: z.string(),
          size: z.number(),
          mimeType: z.string(),
        });
        break;
      default: {
        let str = z.string();
        if (field.config?.validation?.min !== undefined) str = str.min(field.config.validation.min);
        if (field.config?.validation?.max !== undefined) str = str.max(field.config.validation.max);
        schema = str;
      }
    }

    const hasCondition = !!field.config?.conditionalLogic?.length;
    if (hasCondition && field.required) conditionalRequiredFields.push(field);
    shape[field.id] = field.required && !hasCondition ? schema : optionalField(schema);
  }

  const base = z.object(shape);
  if (conditionalRequiredFields.length === 0) return base;

  return base.superRefine((data, ctx) => {
    for (const field of conditionalRequiredFields) {
      if (!isFieldVisible(field, data)) continue;
      if (isEmptyValue(data[field.id])) {
        ctx.addIssue({ code: "custom", path: [field.id], message: "This field is required" });
      }
    }
  });
}

export function defaultValuesFor(fields: PublicField[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === "checkbox") values[field.id] = [];
    // Object-shaped, not string-shaped — leave unset (undefined) so the
    // optional() branch of its zod schema is what matches, not a "" that
    // would fail object validation before a file's ever been attached.
    else if (field.type === "file_upload" || field.type === "statement") continue;
    else values[field.id] = "";
  }
  return values;
}
