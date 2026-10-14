import { db, forms, outboxEvents, eq } from "@formkit/db";
import { TRPCError } from "@trpc/server";
import { dispatchOutboxEvent } from "@formkit/queue";
import type { PublishedFormSnapshot } from "@formkit/db";

export async function publishForm(orgId: string, formId: string, publishedById: string) {
    const form = await db.query.forms.findFirst({ where: { id: formId, orgId } });
    if (!form) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });

    const fields = await db.query.formFields.findMany({
        where: { formId },
        orderBy: { order: "asc" },
    });

    if (fields.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Add at least one field before publishing" });
    }

    const snapshot: PublishedFormSnapshot = {
        title: form.title,
        fields: fields.map((f) => ({
            id: f.id, type: f.type, label: f.label, order: f.order,
            required: f.required ?? false, config: f.config ?? {},
        })),
        settings: form.settings ?? {},
    };

    const { updated, outboxEventId, eventPayload } = await db.transaction(async (tx) => {
        const [updatedForm] = await tx.update(forms)
            .set({ status: "published", publishedSnapshot: snapshot, publishedAt: new Date() })
            .where(eq(forms.id, formId))
            .returning();

        if (!updatedForm) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to publish form" });

        const publisher = await tx.query.users.findFirst({ where: { id: publishedById } });
        if (!publisher) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Publisher not found" });

        const ownerMembership = await tx.query.memberships.findFirst({
            where: { orgId, role: { name: "OWNER" } },
            with: { user: true },
        });

        const recipients: string[] = [publisher.email];
        if (ownerMembership && ownerMembership.userId !== publishedById && ownerMembership.user?.email) {
            recipients.push(ownerMembership.user.email);
        }

        const eventPayload = {
            orgId,
            formId: updatedForm.id,
            formTitle: updatedForm.title,
            recipients,
        };

        const [event] = await tx.insert(outboxEvents).values({
            eventType: "form:published",
            aggregateId: updatedForm.id,
            payload: eventPayload,
        }).returning();
        if (!event) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create outbox event" });

        return { updated: updatedForm, outboxEventId: event.id, eventPayload };
    });

    void dispatchOutboxEvent(outboxEventId, "form:published", eventPayload);

    return {
        id: updated.id,
        orgId: updated.orgId,
        teamId: updated.teamId,
        title: updated.title,
        slug: updated.slug,
        status: updated.status,
        publishedAt: updated.publishedAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
    };
}

