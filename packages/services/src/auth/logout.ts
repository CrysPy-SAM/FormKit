import crypto from "node:crypto";
import { db, refreshTokens, eq, and, isNull } from "@formkit/db";
import { bumpTokenVersion } from "./index.js";

export async function logout(refreshTokenRaw: string | undefined) {
    if (!refreshTokenRaw) return;

    const tokenHash = crypto.createHash("sha256").update(refreshTokenRaw).digest("hex");

    await db.update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(and(
            eq(refreshTokens.tokenHash, tokenHash),
            isNull(refreshTokens.revokedAt), 
        ));
}

export async function logoutAllDevices(userId: string) {
    await db.update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(and(
            eq(refreshTokens.userId, userId),
            isNull(refreshTokens.revokedAt),
        ));

    await bumpTokenVersion(userId);
}