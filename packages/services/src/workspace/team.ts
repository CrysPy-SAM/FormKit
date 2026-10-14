import { count, db, eq, memberships, teams } from "@formkit/db"
import { assertCanCreateTeam } from "./limits.js";
import { TRPCError } from "@trpc/server";
import { CacheNamespace, extendCacheTtl, getCached, invalidateCache, redis, setCached } from "@formkit/redis";


const TEAM_LIST_TTL_SECONDS = 24 * 60 * 60;


type TeamSummary = {
    id: string;
    name: string;
    orgId: string;
    memberCount: number;
};

// Creating the team in org.
export async function createTeam(name: string, orgId: string, createdById: string) {
    await assertCanCreateTeam(orgId);

    const [team] = await db.insert(teams).values({
        name,
        orgId,
        createdById,
    }).returning();

    if (!team) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create team" });
    }

    await invalidateCache(CacheNamespace.ORG_TEAMS, orgId);

    return {
        success: true,
        message: "Team created successfully."
    }
}

// List of the team of the an org.
export async function listTeams(orgId: string): Promise<TeamSummary[]> {
    const cached = await getCached<TeamSummary[]>(CacheNamespace.ORG_TEAMS, orgId);
    if (cached) {
        await extendCacheTtl(CacheNamespace.ORG_TEAMS, orgId, TEAM_LIST_TTL_SECONDS);
        return cached;
    }

    const orgTeams = await db.query.teams.findMany({
        where: { orgId },
    });

    const memberCounts = await db
        .select({ teamId: memberships.teamId, value: count() })
        .from(memberships)
        .where(eq(memberships.orgId, orgId))
        .groupBy(memberships.teamId);

    const countByTeamId = new Map(memberCounts.map((m) => [m.teamId, m.value]));

    const result: TeamSummary[] = orgTeams.map((t) => ({
        id: t.id,
        name: t.name,
        orgId: t.orgId,
        memberCount: countByTeamId.get(t.id) ?? 0,
    }));

    await setCached(CacheNamespace.ORG_TEAMS, orgId, result, TEAM_LIST_TTL_SECONDS);
    return result;
}
