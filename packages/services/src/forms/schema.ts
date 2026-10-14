import { z } from "zod";

export const createFormInput = z.object({
    title: z.string().min(1).max(200).default("New Form"),
    teamId: z.uuid().optional()
});

export const publishFormInput = z.object({
    formId: z.string(),
});

// Per-form visual theme — belongs to the form, not the app's own light/dark
// mode. Stored inside forms.settings (jsonb, already schema-less) and copied
// verbatim into publishedSnapshot.settings at publish time.
export const formThemeSchema = z.object({
    accentColor: z.string().max(20).optional(),
    backgroundColor: z.string().max(20).optional(),
    textColor: z.string().max(20).optional(),
    buttonTextColor: z.string().max(20).optional(),
    fontFamily: z.enum(["sans", "serif", "mono"]).optional(),
    borderRadius: z.enum(["none", "small", "medium", "large", "full"]).optional(),
    cardStyle: z.enum(["flat", "bordered", "shadow"]).optional(),
    layout: z.enum(["centered", "full-bleed"]).optional(),
    progressStyle: z.enum(["bar", "steps", "none"]).optional(),
    logoUrl: z.url().max(500).optional().or(z.literal("")),
}).partial();

// Operational open/close controls — deliberately read from the *live*
// settings, not the published snapshot (unlike theme/fields), so an owner
// can close a form or push back a deadline immediately without needing to
// republish. `null` clears a previously-set limit; omitted leaves it as-is.
export const formCloseSettingsSchema = z.object({
    closeAfterResponses: z.number().int().positive().nullable().optional(),
    closeAt: z.string().nullable().optional(),
});

export const resolvedCloseSettingsSchema = z.object({
    closeAfterResponses: z.number().nullable(),
    closeAt: z.string().nullable(),
});

export const updateFormInput = z.object({
    formId: z.string(),
    title: z.string().min(1).max(200).optional(),
    theme: formThemeSchema.optional(),
    closeSettings: formCloseSettingsSchema.optional(),
});

// forms.schema.ts
export const formOutput = z.object({
    id: z.string(),
    orgId: z.string(),
    teamId: z.string().nullable(),
    title: z.string(),
    slug: z.string(),
    status: z.enum(["draft", "published", "archived"]),
    publishedAt: z.string().nullable(),
    createdAt: z.string(),
});


// forms/fields.schema.ts
// A field is shown only when every condition in this list matches the
// current value of an earlier field — empty/absent means "always show".
// Capped at one condition for now (matches the builder UI); the stored
// shape stays an array so a future "match all of" UI can extend it without
// another schema/migration change.
export const conditionSchema = z.object({
    fieldId: z.string(),
    operator: z.enum(["equals", "not_equals"]),
    value: z.string(),
});

export const fieldConfigSchema = z.object({
    placeholder: z.string().max(200).optional(),
    options: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
    validation: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        pattern: z.string().optional(),
        minSelections: z.number().optional(),
        maxSelections: z.number().optional(),
    }).optional(),
    allowOther: z.boolean().optional(),
    randomizeOrder: z.boolean().optional(),
    conditionalLogic: z.array(conditionSchema).max(1).optional(),
}).partial();

export const createFieldInput = z.object({
    formId: z.string(),
    type: z.enum(["short_text", "long_text", "email", "number", "date", "url", "phone_number", "select", "radio", "checkbox", "rating", "file_upload", "statement", "yes_no"]),
    label: z.string().min(1).max(500),
    order: z.number().int(),
    required: z.boolean().optional(),
    config: fieldConfigSchema.optional(),
});

export const updateFieldInput = z.object({
    formId: z.string(),
    fieldId: z.string(),
    label: z.string().min(1).max(500).optional(),
    order: z.number().int().optional(),
    required: z.boolean().optional(),
    config: fieldConfigSchema.optional(),
});


export const fieldOutput = z.object({
    id: z.string(),
    formId: z.string(),
    type: z.enum(["short_text", "long_text", "email", "number", "date", "url", "phone_number", "select", "radio", "checkbox", "rating", "file_upload", "statement", "yes_no"]),
    label: z.string(),
    order: z.number(),
    required: z.boolean(),
    config: fieldConfigSchema,
});

export const deleteFieldInput = z.object({
    formId: z.string(),
    fieldId: z.string(),
});

export const deleteFieldOutput = z.object({ success: z.boolean() });

export const getFormInput = z.object({
    formId: z.string(),
});

export const formWithFieldsOutput = formOutput.extend({
    fields: z.array(fieldOutput),
    theme: formThemeSchema,
    closeSettings: resolvedCloseSettingsSchema,
});

// forms/public.schema.ts — unauthenticated form fetch + response submission
export const getPublicFormInput = z.object({
    slug: z.string().min(1).max(200),
});

const publicFieldOutput = z.object({
    id: z.string(),
    type: z.enum(["short_text", "long_text", "email", "number", "date", "url", "phone_number", "select", "radio", "checkbox", "rating", "file_upload", "statement", "yes_no"]),
    label: z.string(),
    required: z.boolean(),
    config: fieldConfigSchema,
});

export const publicFormOutput = z.object({
    title: z.string(),
    fields: z.array(publicFieldOutput),
    // Always fully populated by getPublicForm() — safe defaults are merged
    // in server-side so the client never has to guess at missing values.
    theme: formThemeSchema,
});

export const submitResponseInput = z.object({
    slug: z.string().min(1).max(200),
    // keyed by field id; the service rejects unknown keys and validates each
    // value against that field's published type/config.
    answers: z.record(z.string(), z.unknown()),
});

export const submitResponseOutput = z.object({
    success: z.boolean(),
});

// forms/responses.schema.ts — authenticated response viewing
export const getFormResponsesInput = z.object({
    formId: z.string(),
    limit: z.number().min(1).max(100).default(50).optional(),
    offset: z.number().min(0).default(0).optional(),
});

const responseAnswerOutput = z.object({
    fieldId: z.string(),
    label: z.string(),
    value: z.unknown(),
});

const responseOutput = z.object({
    id: z.string(),
    respondentEmail: z.string().nullable(),
    completedAt: z.string().nullable(),
    startedAt: z.string().nullable(),
    answers: z.array(responseAnswerOutput),
});

export const formResponsesOutput = z.object({
    formTitle: z.string(),
    total: z.number(),
    hasMore: z.boolean().optional(),
    responses: z.array(responseOutput),
});

// forms/analytics.schema.ts
export const getFormAnalyticsInput = z.object({
    formId: z.string(),
});

const analyticsOptionStatOutput = z.object({
    id: z.string(),
    label: z.string(),
    count: z.number(),
    percentage: z.number(),
});

export const formFieldAnalyticsOutput = z.object({
    fieldId: z.string(),
    label: z.string(),
    // "statement" is excluded at runtime (see getFormAnalytics) but kept
    // here so this stays a structural match for PublishedFieldSnapshot's
    // full FieldType union.
    type: z.enum([
        "short_text", "long_text", "email", "number", "date", "url", "phone_number",
        "select", "radio", "checkbox", "rating", "file_upload", "statement", "yes_no",
    ]),
    answered: z.number(),
    answerRate: z.number(),
    // rating / number only
    average: z.number().nullable().optional(),
    min: z.number().nullable().optional(),
    max: z.number().nullable().optional(),
    // rating only — fixed 1-5 buckets
    distribution: z.array(z.object({ value: z.number(), count: z.number() })).optional(),
    // select / radio / checkbox / yes_no only
    options: z.array(analyticsOptionStatOutput).optional(),
});

export const formAnalyticsOutput = z.object({
    formTitle: z.string(),
    total: z.number(),
    totalFields: z.number(),
    // Average number of (non-statement) questions answered per response —
    // an honest proxy for "how much of the form people fill in", distinct
    // from a start-to-finish "completion rate" (see getFormAnalytics for
    // why that can't be computed from the current data model).
    averageAnsweredFields: z.number().nullable(),
    trend: z.array(z.object({ date: z.string(), count: z.number() })),
    fields: z.array(formFieldAnalyticsOutput),
});

// forms/templates.schema.ts — static, curated starting points for new forms
const templateFieldTypeSchema = z.enum([
    "short_text", "long_text", "email", "number", "date", "url", "phone_number",
    "select", "radio", "checkbox", "rating", "file_upload", "statement", "yes_no",
]);

export const formTemplateFieldOutput = z.object({
    id: z.string(),
    type: templateFieldTypeSchema,
    label: z.string(),
    required: z.boolean().optional(),
    config: fieldConfigSchema.optional(),
});

export const formTemplateOutput = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.string(),
    icon: z.string(),
    theme: formThemeSchema,
    fields: z.array(formTemplateFieldOutput),
});

export const createFormFromTemplateInput = z.object({
    templateId: z.string(),
    title: z.string().min(1).max(200).optional(),
    teamId: z.uuid().optional(),
});