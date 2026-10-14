import { db } from "@formkit/db";
import { PERMISSIONS } from "@formkit/config";
import { TRPCError } from "@trpc/server";

export async function assertTeamAccess(orgId: string, userId: string, teamId: string | null) {
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
    if (hasOrgWideAccess) return; // org admin — always allowed, regardless of team

    if (teamId === null) return; // org-level (no team) — any org member is fine

    const teamMembership = await db.query.memberships.findFirst({
        where: { userId, orgId, teamId },
    });
    if (!teamMembership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You're not a member of this team" });
    }
}