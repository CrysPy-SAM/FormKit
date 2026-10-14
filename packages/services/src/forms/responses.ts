import { db, count, eq, responses } from "@formkit/db";
import type { PublishedFieldSnapshot } from "@formkit/db";
import { PERMISSIONS } from "@formkit/config";
import { TRPCError } from "@trpc/server";

/**
 * Stored answers for choice-type fields hold the option's id (see
 * buildAnswerSchema in public.ts), not its label — correct for storage, but
 * unreadable to a human owner viewing/exporting responses. Resolves ids back
 * to the labels defined on the field at publish time; falls back to the raw
 * stored value (rather than hiding it) if an option was since edited/removed.
 */
function resolveAnswerDisplayValue(field: PublishedFieldSnapshot | undefined, value: unknown): unknown {
    if (!field) return value;

    if (field.type === "select" || field.type === "radio") {
        if (typeof value !== "string") return value;
        if (value === "other") return "Other";
        return field.config.options?.find((o) => o.id === value)?.label ?? value;
    }

    if (field.type === "checkbox" && Array.isArray(value)) {
        return value.map((v) => {
            if (v === "other") return "Other";
            return field.config.options?.find((o) => o.id === v)?.label ?? v;
        });
    }

    if (field.type === "yes_no") {
        if (value === "yes") return "Yes";
        if (value === "no") return "No";
        return value;
    }

    return value;
}

/**
 * Lists responses for a form the caller can manage. Mirrors the exact
 * org/team visibility check used by getForm() — org-wide admins can see any
 * form's responses, otherwise the caller must be a member of the form's team
 * (or the form must be org-wide, i.e. teamId is null).
 */
export async function getFormResponses(
    orgId: string,
    formId: string,
    userId: string,
    pagination?: { limit?: number; offset?: number }
) {
    const membership = await db.query.memberships.findFirst({
        where: { userId, orgId },
        with: { role: { with: { rolePermissions: { with: { permission: true } } } } },
    });

    if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this org" });
    }
    if (!membership.role) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Membership missing role" });
    }

    const form = await db.query.forms.findFirst({ where: { id: formId, orgId } });
    if (!form) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    }

    const hasOrgWideAccess = membership.role.rolePermissions.some(
        (rp) => rp.permission?.key === PERMISSIONS.ORG_MANAGE_ALL_TEAMS
    );

    if (!hasOrgWideAccess && form.teamId !== null) {
        const teamMembership = await db.query.memberships.findFirst({
            where: { userId, orgId, teamId: form.teamId },
        });
        if (!teamMembership) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You're not a member of this team" });
        }
    }

    const fieldsById = new Map((form.publishedSnapshot?.fields ?? []).map((f) => [f.id, f]));

    const [countResult] = await db
        .select({ value: count() })
        .from(responses)
        .where(eq(responses.formId, formId));
    const total = countResult?.value ?? 0;

    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;

    const formResponses = await db.query.responses.findMany({
        where: { formId },
        with: { answers: true },
        orderBy: { completedAt: "desc" },
        limit,
        offset,
    });

    const hasMore = offset + formResponses.length < total;

    return {
        formTitle: form.title,
        total,
        hasMore,
        responses: formResponses.map((r) => ({
            id: r.id,
            respondentEmail: r.respondentEmail,
            completedAt: r.completedAt?.toISOString() ?? null,
            startedAt: r.startedAt?.toISOString() ?? null,
            answers: r.answers.map((a) => ({
                fieldId: a.fieldId,
                label: fieldsById.get(a.fieldId)?.label ?? "Deleted field",
                value: resolveAnswerDisplayValue(fieldsById.get(a.fieldId), a.value),
            })),
        })),
    };
}
