import { db, subscriptions, plans, forms, eq, and, count, isNull, teams, memberships } from "@formkit/db";
import { TRPCError } from "@trpc/server";
import { getOrgSubscriptionWithPlan } from "./subscription.js";

export async function assertFormLimitNotExceeded(orgId: string) {
    const subscription = await db.query.subscriptions.findFirst({
        where: { orgId },
        with: { plan: true },
    });

    if (!subscription || !subscription.plan) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No active subscription found for this org" });
    }

    const maxForms = subscription.plan.limits.maxForms;

    if (maxForms === -1) return;

    const [result] = await db
        .select({ value: count() })
        .from(forms)
        .where(and(eq(forms.orgId, orgId), isNull(forms.deletedAt)));

    const currentCount = result?.value ?? 0;

    if (currentCount >= maxForms) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: `Your ${subscription.plan.name} plan allows up to ${maxForms} forms. Upgrade to create more.`,
        });
    }
}


export async function assertCanCreateTeam(orgId: string) {
    const subscription = await getOrgSubscriptionWithPlan(orgId);
    const maxTeams = subscription.plan.limits.maxTeams;

    if (maxTeams === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: `Your ${subscription.plan.name} plan doesn't include teams. Upgrade to create one.` });
    }
    if (maxTeams === -1) return;

    const [result] = await db.select({ value: count() }).from(teams).where(eq(teams.orgId, orgId));
    if ((result?.value ?? 0) >= maxTeams) {
        throw new TRPCError({ code: "FORBIDDEN", message: `Your ${subscription.plan.name} plan allows up to ${maxTeams} teams.` });
    }
}

export async function assertCanInviteToOrg(orgId: string) {
    const subscription = await getOrgSubscriptionWithPlan(orgId);
    const maxOrgMembers = subscription.plan.limits.maxOrgMembers;

    if (maxOrgMembers === -1) return;

    const [result] = await db
        .select({ value: count() })
        .from(memberships)
        .where(and(eq(memberships.orgId, orgId), isNull(memberships.teamId))); // org-level memberships specifically, adjust if counting differently
    if ((result?.value ?? 0) >= maxOrgMembers) {
        throw new TRPCError({ code: "FORBIDDEN", message: `Your ${subscription.plan.name} plan allows up to ${maxOrgMembers} members.` });
    }
}

export async function assertCanAddToTeam(teamId: string) {
    const team = await db.query.teams.findFirst({ where: { id: teamId } });
    if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });

    const subscription = await getOrgSubscriptionWithPlan(team.orgId);
    const maxTeamMembers = subscription.plan.limits.maxTeamMembers;
    if (maxTeamMembers === -1) return;

    const [result] = await db.select({ value: count() }).from(memberships).where(eq(memberships.teamId, teamId));
    if ((result?.value ?? 0) >= maxTeamMembers) {
        throw new TRPCError({ code: "FORBIDDEN", message: `This team has reached its member limit (${maxTeamMembers}).` });
    }
}