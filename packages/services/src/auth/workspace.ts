import { db, orgs, memberships, roles, subscriptions, plans } from "@formkit/db";
import { TRPCError } from "@trpc/server";
import { generateSlug } from "@formkit/utils";

export async function createPersonalWorkspace(tx: any, userId: string, userName: string | null) {

    const [personalOrg] = await tx.insert(orgs).values({
        name: `${userName ?? "My"}'s Workspace`,
        slug: generateSlug({ name: userName, userId }),
        createdById: userId,
        isPersonal: true,
    }).returning();

    if (!personalOrg) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create personal workspace" });
    }

    const ownerRole = await tx.query.roles.findFirst({ where: { name: "OWNER" } });
    if (!ownerRole) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "System roles not seeded" });
    }

    await tx.insert(memberships).values({
        userId,
        orgId: personalOrg.id,
        roleId: ownerRole.id,
    });

    const plan = await tx.query.plans.findFirst({ where: { tier: "free" } });
    if (!plan) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Plan tier free not seeded` });
    }

    await tx.insert(subscriptions).values({
        orgId: personalOrg.id,
        planId: plan.id,
        status: "active",
    });

    return personalOrg;
}