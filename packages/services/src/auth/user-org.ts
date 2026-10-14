import { db } from "@formkit/db";

export type UserOrgSummary = {
    id: string;
    slug: string;
    name: string;
    isPersonal: boolean;
    role: string;
};

export async function getUserOrgs(userId: string): Promise<UserOrgSummary[]> {
    const memberships = await db.query.memberships.findMany({
        where: { userId },
        with: { org: true, role: true },
    });

    return memberships
        .filter((m): m is typeof m & { org: NonNullable<typeof m.org>; role: NonNullable<typeof m.role> } =>
            m.org !== null && m.role !== null
        )
        .map((m) => ({
            id: m.org.id,
            slug: m.org.slug,
            name: m.org.name,
            isPersonal: m.org.isPersonal,
            role: m.role.name,
        }))
        .sort((a, b) => Number(b.isPersonal) - Number(a.isPersonal));
}