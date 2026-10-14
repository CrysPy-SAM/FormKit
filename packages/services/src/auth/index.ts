import { db, eq, refreshTokens, sql, users } from "@formkit/db";
import { TRPCError } from "@trpc/server";
import type { AccessPayload } from "@formkit/types";
import crypto from "node:crypto";


// Creating User Session
export async function createSession(
    userId: string,
    tokenVersion: number,
    signAccess: (p: { sub: string; v: number }) => Promise<string>,
    signRefresh: (p: { sub: string; v: number }) => Promise<string>,
    deviceInfo: { userAgent?: string; ip?: string },
) {
    const accessToken = await signAccess({ sub: userId, v: tokenVersion });
    const refreshToken = await signRefresh({ sub: userId, v: tokenVersion });

    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await db.insert(refreshTokens).values({
        userId,
        tokenHash,
        userAgent: deviceInfo.userAgent,
        ip: deviceInfo.ip,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken };
}

// Manul loginout user via server
export async function bumpTokenVersion(userId: string) {
    const [updated] = await db.update(users)
        .set({ tokenVersion: sql`${users.tokenVersion} + 1` })
        .where(eq(users.id, userId))
        .returning({ tokenVersion: users.tokenVersion });

    if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: `User not found: ${userId}` });
    }
    return updated.tokenVersion;
}

//  Getting the User Refresh Token Version.
export async function getUserTokenVersion(userId: string) {
    const user = await db.query.users.findFirst({ where: { id: userId } });
    return user?.tokenVersion ?? null;
}

// Getting Valid token Version 
export async function isTokenVersionValid(payload: AccessPayload): Promise<boolean> {
    const user = await db.query.users.findFirst({ where: { id: payload.sub } });
    return !!user && user.tokenVersion === payload.v;
}

export * from "./credentials_signup.js";
export * from "./google_signup.js"
export * from "./verify_email.js"
export * from "./login.js"
export * from "./logout.js"
export * from "./forget_password.js"
export * from "./reset_password.js"
export * from "./refresh.js"
export * from "./user-org.js"
