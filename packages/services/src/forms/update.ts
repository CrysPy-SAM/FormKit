import { db, forms, eq, and } from "@formkit/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { serializeForm } from "./serialize.js";
import { updateFormInput } from "./schema.js";

export async function updateForm(
    orgId: string,
    formId: string,
    input: z.infer<typeof updateFormInput>,
) {
    let settingsPatch: (typeof forms.$inferInsert)["settings"] | undefined;

    if (input.theme !== undefined || input.closeSettings !== undefined) {
        const existing = await db.query.forms.findFirst({
            where: { id: formId, orgId },
            columns: { settings: true },
        });
        if (!existing) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
        }
        // Merge into whatever settings already exist (redirectUrl, etc.) —
        // never clobber unrelated settings the owner already configured.
        settingsPatch = { ...existing.settings };

        if (input.theme !== undefined) {
            settingsPatch.formTheme = { ...existing.settings?.formTheme, ...input.theme };
        }

        if (input.closeSettings !== undefined) {
            // null means "clear this limit"; omitted (undefined) means
            // "leave whatever's already set" — standard PATCH semantics.
            if (input.closeSettings.closeAfterResponses !== undefined) {
                settingsPatch.closeAfterResponses = input.closeSettings.closeAfterResponses ?? undefined;
            }
            if (input.closeSettings.closeAt !== undefined) {
                settingsPatch.closeAt = input.closeSettings.closeAt ?? undefined;
            }
        }
    }

    const [updated] = await db
        .update(forms)
        .set({
            ...(input.title !== undefined && { title: input.title }),
            ...(settingsPatch !== undefined && { settings: settingsPatch }),
            updatedAt: new Date(),
        })
        .where(and(eq(forms.id, formId), eq(forms.orgId, orgId)))
        .returning();

    if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    }

    return serializeForm(updated);
}
