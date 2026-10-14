import { db, eq, roles, permissions, rolePermissions, plans } from "../index.js";
import { PERMISSIONS } from "@formkit/config";


const SYSTEM_ROLES = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;

// Which permissions each system role gets. OWNER implicitly gets everything.
const ROLE_PERMISSION_MAP: Record<Exclude<(typeof SYSTEM_ROLES)[number], "OWNER">, string[]> = {
    ADMIN: [
        PERMISSIONS.FORM_CREATE, PERMISSIONS.FORM_PUBLISH, PERMISSIONS.FORM_DELETE,
        PERMISSIONS.RESPONSE_VIEW, PERMISSIONS.RESPONSE_EXPORT,
        PERMISSIONS.MEMBER_INVITE, PERMISSIONS.MEMBER_REMOVE,
        PERMISSIONS.ORG_SETTINGS,
        // deliberately NOT role:manage or billing:manage — reserved for OWNER
    ],
    EDITOR: [
        PERMISSIONS.FORM_CREATE, PERMISSIONS.FORM_PUBLISH,
        PERMISSIONS.RESPONSE_VIEW, PERMISSIONS.RESPONSE_EXPORT,
    ],
    VIEWER: [
        PERMISSIONS.RESPONSE_VIEW,
    ],
};

const PLANS = [
    {
        tier: "free" as const,
        name: "Free",
        priceMonthlyPaise: 0,
        // maxTeams: 0 is a distinct, intentional value from -1 (unlimited) — see
        // assertCanCreateTeam() in workspace/limits.ts, which treats 0 as "this
        // plan doesn't include teams at all" rather than "limited to 0 teams".
        limits: { maxForms: 3, maxResponsesPerMonth: 100, maxOrgMembers: 1, maxTeamMembers: 1, maxTeams: 0, customBranding: false },
    },
    {
        tier: "pro" as const,
        name: "Pro",
        priceMonthlyPaise: 99900, // ₹999/mo — adjust to your actual pricing
        limits: { maxForms: 25, maxResponsesPerMonth: 5000, maxOrgMembers: 10, maxTeamMembers: 10, maxTeams: 3, customBranding: true },
    },
    {
        tier: "business" as const,
        name: "Business",
        priceMonthlyPaise: 299900,
        limits: { maxForms: -1, maxResponsesPerMonth: -1, maxOrgMembers: -1, maxTeamMembers: -1, maxTeams: -1, customBranding: true }, // -1 = unlimited
    },
];

async function seedPermissions() {
    const values = Object.values(PERMISSIONS).map((key) => ({ key }));
    for (const value of values) {
        const existing = await db.query.permissions.findFirst({ where: { key: value.key } });
        if (!existing) {
            await db.insert(permissions).values(value);
        }
    }
    console.log(`✓ Seeded ${values.length} permissions`);
}

async function seedRoles() {
    for (const name of SYSTEM_ROLES) {
        const existing = await db.query.roles.findFirst({ where: { name } });
        if (!existing) {
            await db.insert(roles).values({ name });
        }
    }
    console.log(`✓ Seeded ${SYSTEM_ROLES.length} system roles`);
}

async function seedRolePermissions() {
    const allRoles = await db.query.roles.findMany();
    const allPermissions = await db.query.permissions.findMany();

    const roleByName = new Map(allRoles.map((r) => [r.name, r]));
    const permByKey = new Map(allPermissions.map((p) => [p.key, p]));

    let count = 0;

    // OWNER gets every permission that exists
    const owner = roleByName.get("OWNER");
    if (owner) {
        for (const perm of allPermissions) {
            const existing = await db.query.rolePermissions.findFirst({
                where: { roleId: owner.id, permissionId: perm.id },
            });
            if (!existing) {
                await db.insert(rolePermissions).values({ roleId: owner.id, permissionId: perm.id });
                count++;
            }
        }
    }

    // ADMIN, EDITOR, VIEWER get their mapped subset
    for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSION_MAP)) {
        const role = roleByName.get(roleName);
        if (!role) continue;

        for (const key of permKeys) {
            const perm = permByKey.get(key);
            if (!perm) continue;

            const existing = await db.query.rolePermissions.findFirst({
                where: { roleId: role.id, permissionId: perm.id },
            });
            if (!existing) {
                await db.insert(rolePermissions).values({ roleId: role.id, permissionId: perm.id });
                count++;
            }
        }
    }

    console.log(`✓ Seeded ${count} role-permission mappings`);
}

async function seedPlans() {
    for (const plan of PLANS) {
        const existing = await db.query.plans.findFirst({ where: { tier: plan.tier } });
        if (!existing) {
            await db.insert(plans).values(plan);
        } else {
            // Keep already-seeded rows in sync with PLANS above — insert-if-absent
            // alone would silently leave stale/incomplete `limits` in place on a
            // database that was seeded before this plan definition changed.
            await db.update(plans)
                .set({
                    name: plan.name,
                    priceMonthlyPaise: plan.priceMonthlyPaise,
                    limits: plan.limits,
                })
                .where(eq(plans.tier, plan.tier));
        }
    }
    console.log(`✓ Seeded ${PLANS.length} plans`);
}

async function seed() {
    console.log("Seeding database...");
    await seedPermissions();
    await seedRoles();
    await seedRolePermissions(); // must run after both roles and permissions exist
    await seedPlans();
    console.log("Seed complete.");
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});