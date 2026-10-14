import { db } from "@formkit/db";
import { CacheNamespace, extendCacheTtl, getCached, invalidateCache, setCached } from "@formkit/redis";
import { TRPCError } from "@trpc/server";
import { UserProfile } from "./model.js";

const PROFILE_TTL_SECONDS = 24 * 60 * 60;

type UserOrgSummary = {
    id: string;
    slug: string;
    name: string;
    isPersonal: boolean;
    role: string;
};

export type UserProfileWithOrgs = UserProfile & {
    orgs: UserOrgSummary[];
};

export async function getMyProfile(userId: string): Promise<UserProfileWithOrgs> {

    const cached = await getCached<UserProfileWithOrgs>(CacheNamespace.USER_PROFILE, userId);
    if (cached) {
        await extendCacheTtl(CacheNamespace.USER_PROFILE, userId, PROFILE_TTL_SECONDS);
        return cached;
    }

    const user = await db.query.users.findFirst({ where: { id: userId } });
    if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const memberships = await db.query.memberships.findMany({
        where: { userId },
        with: { org: true, role: true },
    });

    const orgs: UserOrgSummary[] = [];

    for (const m of memberships) {
        if (!m.org || !m.role) {
            console.error(`Membership ${m.id} missing org or role — data integrity issue`);
            continue;
        }
        orgs.push({
            id: m.org.id,
            slug: m.org.slug,
            name: m.org.name,
            isPersonal: m.org.isPersonal,
            role: m.role.name,
        });
    }
    orgs.sort((a, b) => Number(b.isPersonal) - Number(a.isPersonal));

    const profile: UserProfileWithOrgs = {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        provider: user.provider,
        emailVerified: user.emailVerified ?? false,
        createdAt: user.createdAt!.toISOString(),
        orgs,
    };

    await setCached(CacheNamespace.USER_PROFILE, userId, profile, PROFILE_TTL_SECONDS);
    return profile;
}

export async function invalidateProfileCache(userId: string) {
    await invalidateCache(CacheNamespace.USER_PROFILE, userId);
}