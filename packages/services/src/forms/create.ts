import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createFormInput } from "./schema.js";
import { db, forms } from "@formkit/db";
import { generateFormSlug } from "@formkit/utils";
import { TRPCError } from "@trpc/server";
import { assertFormLimitNotExceeded } from "../workspace/limits.js";
import { assertTeamAccess } from "./access.js";

export async function createForm(orgId: string, createdById: string, input: z.infer<typeof createFormInput>) {

    await assertTeamAccess(orgId, createdById, input.teamId ?? null);
    await assertFormLimitNotExceeded(orgId);

    const formId = randomUUID();
    const [newForm] = await db.insert(forms).values({
        id: formId,
        orgId,
        teamId: input.teamId ?? null,
        createdById,
        title: input.title,
        slug: generateFormSlug(input.title, formId),
        status: "draft",
    }).returning();

    if (!newForm) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create form" });
    }

    return {
        id: newForm.id,
        orgId: newForm.orgId,
        teamId: newForm.teamId,
        title: newForm.title,
        slug: newForm.slug,
        status: newForm.status,
        publishedAt: newForm.publishedAt?.toISOString() ?? null,
        createdAt: newForm.createdAt.toISOString(),
    };
}