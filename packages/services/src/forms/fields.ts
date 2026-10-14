import { db, formFields, eq, and } from "@formkit/db";
import { TRPCError } from "@trpc/server";
import { serializeField } from "./serialize.js";
import z from "zod";
import { createFieldInput, updateFieldInput } from "./schema.js";

async function assertFormAccess(orgId: string, formId: string) {
    const form = await db.query.forms.findFirst({ where: { id: formId, orgId } });
    if (!form) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    return form;
}

export async function addField(orgId: string, formId: string, input: z.infer<typeof createFieldInput>) {
    await assertFormAccess(orgId, formId);

    const [field] = await db.insert(formFields).values({
        formId,
        type: input.type,
        label: input.label,
        order: input.order,
        required: input.required ?? false,
        config: input.config ?? {},
    }).returning();

    if (!field) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create field" });

    return serializeField(field);
}

export async function updateField(orgId: string, formId: string, fieldId: string, input: z.infer<typeof updateFieldInput>) {
    await assertFormAccess(orgId, formId);

    const [field] = await db.update(formFields)
        .set({ ...(input.label !== undefined && { label: input.label }), ...(input.config !== undefined && { config: input.config }), ...(input.required !== undefined && { required: input.required }) })
        .where(and(eq(formFields.id, fieldId), eq(formFields.formId, formId)))
        .returning();

    if (!field) throw new TRPCError({ code: "NOT_FOUND", message: "Field not found" });
    return serializeField(field); // again: publishedSnapshot untouched
}

export async function deleteField(orgId: string, formId: string, fieldId: string) {
    await assertFormAccess(orgId, formId);

    const [deleted] = await db.delete(formFields)
        .where(and(eq(formFields.id, fieldId), eq(formFields.formId, formId)))
        .returning();

    if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Field not found" });
    }

    return { success: true };
}