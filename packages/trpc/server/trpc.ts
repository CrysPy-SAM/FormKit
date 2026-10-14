import { initTRPC, TRPCError } from "@trpc/server";
import type { OpenApiMeta } from "trpc-to-openapi";
import type { Context } from "./context.js";
import { ZodError } from "zod";
import { db } from "@formkit/db";
import { PermissionKey } from "@formkit/config";

const t = initTRPC
    .meta<OpenApiMeta>()
    .context<Context>()
    .create({
        errorFormatter({ shape, error, ctx }) {
            const zodError =
                error.cause instanceof ZodError ? error.cause.flatten().fieldErrors : null;
            return {
                ...shape,
                data: {
                    ...shape.data,
                    zodError,
                    requestId: ctx?.requestId,
                    userId: ctx?.user?.sub,
                },
            };
        },
    });

const baseProcedure = t.procedure;
export const router = t.router;
export const publicProcedure = baseProcedure;

export const protectedProcedure = baseProcedure.use(({ ctx, next }) => {
    if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }
    return next({
        ctx: {
            ...ctx,
            user: ctx.user,
        },
    });
});

export const orgProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    if (!ctx.orgId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Missing org context" });
    }

    const membership = await db.query.memberships.findFirst({
        where: { userId: ctx.user.sub, orgId: ctx.orgId },
        with: { role: true },
    });

    if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this org" });
    }

    return next({
        ctx: {
            ...ctx,
            orgId: ctx.orgId,
            membership,
        },
    });
});

const ROLE_PERMISSIONS_CACHE = new Map<string, { keys: Set<string>; timestamp: number }>();
const ROLE_PERMISSIONS_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getRolePermissions(roleId: string): Promise<Set<string>> {
    const cached = ROLE_PERMISSIONS_CACHE.get(roleId);
    if (cached && Date.now() - cached.timestamp < ROLE_PERMISSIONS_TTL_MS) {
        return cached.keys;
    }

    const rolePermissionMappings = await db.query.rolePermissions.findMany({
        where: { roleId },
        with: { permission: true },
    });

    const keys = new Set(
        rolePermissionMappings
            .map((rp) => rp.permission?.key)
            .filter((key): key is string => Boolean(key))
    );

    ROLE_PERMISSIONS_CACHE.set(roleId, { keys, timestamp: Date.now() });
    return keys;
}

export const hasPermission = (permissionKey: PermissionKey) => orgProcedure.use(async ({ ctx, next }) => {
    // OWNER role implicitly has all permissions (matching seed.ts ROLE_PERMISSION_MAP design)
    if (ctx.membership.role?.name === "OWNER") {
        return next();
    }

    const allowedKeys = await getRolePermissions(ctx.membership.roleId);

    if (!allowedKeys.has(permissionKey)) {
        throw new TRPCError({ code: "FORBIDDEN", message: `Missing permission: ${permissionKey}` });
    }

    return next();
});