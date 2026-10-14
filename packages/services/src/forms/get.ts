import { db } from "@formkit/db";
import { PERMISSIONS } from "@formkit/config";
import { TRPCError } from "@trpc/server";
import { serializeField, serializeForm } from "./serialize.js";

export async function getForm(orgId: string, formId: string, userId: string) {
    const membership = await db.query.memberships.findFirst({
        where: { userId, orgId },
        with: { role: { with: { rolePermissions: { with: { permission: true } } } } },
    });

    if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this org" });
    }

    if (!membership.role) {
        console.error(`Membership ${membership.id} missing role — data integrity issue`);
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

    const fields = await db.query.formFields.findMany({
        where: { formId },
        orderBy: { order: "asc" },
    });

    return {
        ...serializeForm(form),
        fields: fields.map(serializeField),
    };
}
