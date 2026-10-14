import { z } from "zod";
import { db, formFields, eq } from "@formkit/db";
import { TRPCError } from "@trpc/server";
import { FORM_TEMPLATES, getFormTemplate } from "./templates-data.js";
import { createFormFromTemplateInput } from "./schema.js";
import { createForm } from "./create.js";
import { updateForm } from "./update.js";

export function listFormTemplates() {
    return FORM_TEMPLATES;
}

/**
 * Seeds a normal, fully-editable draft form from a static template: reuses
 * createForm() (permission + team + plan-limit checks included) for the
 * form row, bulk-inserts the template's fields exactly like the builder's
 * "add field" would one at a time, then reuses updateForm() to store the
 * template's theme. Nothing about the resulting form is special or
 * locked — it's indistinguishable from a form built by hand.
 */
export async function createFormFromTemplate(
    orgId: string,
    createdById: string,
    input: z.infer<typeof createFormFromTemplateInput>,
) {
    const template = getFormTemplate(input.templateId);
    if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
    }

    const newForm = await createForm(orgId, createdById, {
        title: input.title?.trim() || template.name,
        teamId: input.teamId,
    });

    if (template.fields.length > 0) {
        const inserted = await db.insert(formFields).values(
            template.fields.map((field, index) => ({
                formId: newForm.id,
                type: field.type,
                label: field.label,
                order: index,
                required: field.required ?? false,
                config: field.config ?? {},
            })),
        ).returning();

        // A single multi-row INSERT ... VALUES (...) RETURNING preserves
        // row order in Postgres, so position-matching against the template
        // array (both length N) is safe here.
        const realIdByTemplateFieldId = new Map(
            template.fields.map((field, index) => [field.id, inserted[index]!.id]),
        );

        // conditionalLogic in the template data references *other template
        // fields* by their authoring-time string id (e.g. "attending") —
        // meaningful only within templates-data.ts. The real form's fields
        // get fresh UUIDs on insert, so those references must be rewritten
        // to the real id before the rule means anything to isFieldVisible().
        for (let i = 0; i < template.fields.length; i++) {
            const templateField = template.fields[i]!;
            const condition = templateField.config?.conditionalLogic?.[0];
            if (!condition) continue;

            const realSourceId = realIdByTemplateFieldId.get(condition.fieldId);
            if (!realSourceId) continue;

            await db.update(formFields)
                .set({ config: { ...inserted[i]!.config, conditionalLogic: [{ ...condition, fieldId: realSourceId }] } })
                .where(eq(formFields.id, inserted[i]!.id));
        }
    }

    return updateForm(orgId, newForm.id, { formId: newForm.id, theme: template.theme });
}
