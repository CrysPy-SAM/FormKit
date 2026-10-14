import { db, forms, responses, responseAnswers, outboxEvents } from "@formkit/db";
import type { Form, PublishedFieldSnapshot } from "@formkit/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { dispatchOutboxEvent } from "@formkit/queue";
import { uploadFileExists } from "@formkit/utils";
import { submitResponseInput } from "./schema.js";

const FORM_CLOSED_MESSAGE = "This form is no longer accepting responses.";

/**
 * Open/close controls read the *live* `settings` (not the published
 * snapshot the rest of this file uses) so an owner can close a form or push
 * back a deadline immediately, without needing to republish — see
 * formCloseSettingsSchema in schema.ts. Checked both when a visitor loads
 * the form and again right before a submission is accepted, so someone who
 * had the page open before the cutoff can't slip a response in after it.
 */
async function getFormCloseReason(form: Form): Promise<string | null> {
    const closeAt = form.settings?.closeAt;
    if (closeAt && new Date(closeAt).getTime() <= Date.now()) {
        return FORM_CLOSED_MESSAGE;
    }

    const limit = form.settings?.closeAfterResponses;
    if (limit !== undefined) {
        const existing = await db.query.responses.findMany({
            where: { formId: form.id },
            columns: { id: true },
        });
        if (existing.length >= limit) {
            return FORM_CLOSED_MESSAGE;
        }
    }

    return null;
}

/**
 * Fetches a published form for an unauthenticated visitor, keyed only by its
 * public slug. Serves from `publishedSnapshot` (frozen at publish time), not
 * the live `formFields` table, so a link stays stable while the owner keeps
 * editing their draft. Never returns org/team/creator ids or form settings.
 */
export async function getPublicForm(slug: string) {
    const form = await db.query.forms.findFirst({ where: { slug, status: "published" } });

    if (!form || !form.publishedSnapshot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "This form isn't available." });
    }

    const closedReason = await getFormCloseReason(form);
    if (closedReason) {
        throw new TRPCError({ code: "FORBIDDEN", message: closedReason });
    }

    return {
        title: form.publishedSnapshot.title,
        fields: form.publishedSnapshot.fields
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((f) => ({
                id: f.id,
                type: f.type,
                label: f.label,
                required: f.required,
                config: f.config,
            })),
        // Whatever the owner had set at publish time — possibly empty for
        // forms published before theming existed. Defaults are resolved
        // client-side (one place, shared by both the public page and the
        // authenticated preview) rather than baked in here.
        theme: form.publishedSnapshot.settings?.formTheme ?? {},
    };
}

const EMPTY_VALUES = new Set(["", null, undefined]);

function isEmpty(value: unknown): boolean {
    if (EMPTY_VALUES.has(value as never)) return true;
    if (Array.isArray(value)) return value.length === 0;
    return false;
}

/**
 * Mirrors the (UX-only) client-side check in public-form-schema.ts, but this
 * is the copy that's authoritative: a conditionally-hidden field must never
 * be required or validated server-side, no matter what the client sent.
 */
function isFieldVisible(field: PublishedFieldSnapshot, answers: Record<string, unknown>): boolean {
    const conditions = field.config.conditionalLogic;
    if (!conditions || conditions.length === 0) return true;
    return conditions.every((condition) => {
        const actual = answers[condition.fieldId];
        return condition.operator === "not_equals" ? actual !== condition.value : actual === condition.value;
    });
}

/** Builds a per-submission Zod schema from the published field snapshot — the
 * single source of truth for what a valid answer looks like for each field
 * type. Mirrors the (UX-only) client-side schema in the web app, but this is
 * the copy that's actually authoritative. */
function buildAnswerSchema(field: PublishedFieldSnapshot): z.ZodType {
    const options = field.config.options ?? [];
    const optionIds = new Set(options.map((o) => o.id));
    if (field.config.allowOther) optionIds.add("other");

    let schema: z.ZodType;

    switch (field.type) {
        case "email":
            schema = z.email();
            break;
        case "url":
            schema = z.url();
            break;
        case "number": {
            let num = z.coerce.number();
            if (field.config.validation?.min !== undefined) num = num.min(field.config.validation.min);
            if (field.config.validation?.max !== undefined) num = num.max(field.config.validation.max);
            schema = num;
            break;
        }
        case "rating":
            schema = z.coerce.number().int().min(1).max(5);
            break;
        case "date":
            schema = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");
            break;
        case "select":
        case "radio":
            schema = z.string().refine((v) => optionIds.has(v), "Not a valid option for this question");
            break;
        case "yes_no":
            schema = z.enum(["yes", "no"]);
            break;
        case "checkbox": {
            let arr = z.array(z.string().refine((v) => optionIds.has(v), "Not a valid option for this question"));
            if (field.config.validation?.minSelections !== undefined) {
                arr = arr.min(field.config.validation.minSelections);
            }
            if (field.config.validation?.maxSelections !== undefined) {
                arr = arr.max(field.config.validation.maxSelections);
            }
            schema = arr;
            break;
        }
        case "short_text":
        case "long_text":
        case "phone_number": {
            let str = z.string();
            if (field.config.validation?.min !== undefined) str = str.min(field.config.validation.min);
            if (field.config.validation?.max !== undefined) str = str.max(field.config.validation.max);
            if (field.config.validation?.pattern) {
                const patternStr = field.config.validation.pattern;
                if (typeof patternStr === "string" && patternStr.length <= 250) {
                    try {
                        str = str.regex(new RegExp(patternStr), "Doesn't match the required format");
                    } catch {
                        // Ignore malformed regex to prevent server crash
                    }
                }
            }
            schema = str;
            break;
        }
        // The respondent uploads the actual bytes separately, ahead of
        // submission, via the public /uploads endpoint (see
        // apps/api/src/plugins/09-uploads.ts) — this only validates that the
        // answer is a reference to a file that upload returned. Real
        // existence on disk is re-checked below, not just shape here.
        case "file_upload":
            schema = z.object({
                id: z.string(),
                filename: z.string(),
                size: z.number(),
                mimeType: z.string(),
            });
            break;
        // Informational-only, never collects a value.
        case "statement":
            return z.unknown().optional();
        default:
            schema = z.string();
    }

    return field.required ? schema : z.union([schema, z.undefined()]);
}

type SubmitInput = z.infer<typeof submitResponseInput>;

export async function submitPublicResponse(
    slug: string,
    input: Pick<SubmitInput, "answers">,
    meta: { ip?: string; userAgent?: string; referrer?: string },
) {
    const form = await db.query.forms.findFirst({ where: { slug, status: "published" } });
    if (!form || !form.publishedSnapshot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "This form isn't available." });
    }

    const closedReason = await getFormCloseReason(form);
    if (closedReason) {
        throw new TRPCError({ code: "FORBIDDEN", message: closedReason });
    }

    const fieldsById = new Map(form.publishedSnapshot.fields.map((f) => [f.id, f]));

    // Reject unknown field ids outright — never silently drop them.
    for (const fieldId of Object.keys(input.answers)) {
        if (!fieldsById.has(fieldId)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown field: ${fieldId}` });
        }
    }

    const fieldErrors: string[] = [];
    const validatedAnswers: { fieldId: string; value: unknown }[] = [];

    for (const field of form.publishedSnapshot.fields) {
        if (field.type === "statement") continue;
        // Hidden by another answer's skip logic — never require or store it,
        // regardless of what (if anything) the client happened to send.
        if (!isFieldVisible(field, input.answers)) continue;

        const raw = input.answers[field.id];

        if (field.required && isEmpty(raw)) {
            fieldErrors.push(`"${field.label}" is required`);
            continue;
        }
        if (isEmpty(raw)) continue; // optional and not answered

        const result = buildAnswerSchema(field).safeParse(raw);
        if (!result.success) {
            fieldErrors.push(`"${field.label}": ${result.error.issues[0]?.message ?? "invalid value"}`);
            continue;
        }

        // For file_upload, the shape check above only proves the answer
        // *looks like* an upload reference — confirm the file actually
        // exists on disk before trusting it (rejects forged/expired ids
        // rather than silently accepting a broken reference).
        if (field.type === "file_upload") {
            const fileValue = result.data as { id: string };
            if (!uploadFileExists(fileValue.id)) {
                fieldErrors.push(`"${field.label}": the uploaded file could not be found — please re-upload it`);
                continue;
            }
        }

        validatedAnswers.push({ fieldId: field.id, value: result.data });
    }

    if (fieldErrors.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: fieldErrors.join("; ") });
    }

    const emailField = form.publishedSnapshot.fields.find((f) => f.type === "email");
    const respondentEmail = emailField
        ? (validatedAnswers.find((a) => a.fieldId === emailField.id)?.value as string | undefined)
        : undefined;

    const { outboxEventId, eventPayload } = await db.transaction(async (tx) => {
        const [response] = await tx.insert(responses).values({
            formId: form.id,
            respondentEmail: respondentEmail ?? null,
            metadata: meta,
            completedAt: new Date(),
        }).returning();

        if (!response) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save response" });
        }

        if (validatedAnswers.length > 0) {
            await tx.insert(responseAnswers).values(
                validatedAnswers.map((a) => ({
                    responseId: response.id,
                    fieldId: a.fieldId,
                    value: a.value,
                })),
            );
        }

        // Notify the form's owner (plus any extra addresses they've configured)
        // via the same outbox/BullMQ pattern already used for form:published —
        // this table's eventType column comment has anticipated exactly this
        // event since the schema was first written.
        const creator = await tx.query.users.findFirst({ where: { id: form.createdById } });
        const recipients = [
            ...(creator?.email ? [creator.email] : []),
            ...(form.settings?.notificationEmails ?? []),
        ];

        const eventPayload = {
            formId: form.id,
            formTitle: form.publishedSnapshot!.title,
            responseId: response.id,
            respondentEmail: respondentEmail ?? null,
            recipients,
        };

        const [event] = await tx.insert(outboxEvents).values({
            eventType: "response:submitted",
            aggregateId: response.id,
            payload: eventPayload,
        }).returning();

        if (!event) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create outbox event" });
        }

        return { outboxEventId: event.id, eventPayload };
    });

    void dispatchOutboxEvent(outboxEventId, "response:submitted", eventPayload);

    return { success: true as const };
}
