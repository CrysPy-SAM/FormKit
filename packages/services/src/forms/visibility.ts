import { db } from "@formkit/db";
import { PERMISSIONS } from "@formkit/config";
import { TRPCError } from "@trpc/server";
import { serializeForm } from "./serialize.js";

export async function getVisibleFormsForUser(orgId: string, userId: string) {
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

    const hasOrgWideAccess = membership.role.rolePermissions.some(
        (rp) => rp.permission?.key === PERMISSIONS.ORG_MANAGE_ALL_TEAMS
    );

    if (hasOrgWideAccess) {
        const allForms = await db.query.forms.findMany({ where: { orgId } });
        return allForms.map(serializeForm);
    }

    const myTeamMemberships = await db.query.memberships.findMany({
        where: { userId, orgId, teamId: { isNotNull: true } },
        columns: { teamId: true },
    });
    const myTeamIds = myTeamMemberships
        .map((m) => m.teamId)
        .filter((id): id is string => !!id);

    const visibleForms = await db.query.forms.findMany({
        where: {
            orgId,
            OR: [
                { teamId: { isNull: true } },
                { teamId: { in: myTeamIds } },
            ],
        },
    });

    return visibleForms.map(serializeForm);
}