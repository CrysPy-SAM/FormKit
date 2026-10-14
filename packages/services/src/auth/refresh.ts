import crypto from "node:crypto";
import { AccessPayload } from "@formkit/types";
import { TRPCError } from "@trpc/server";
import { db, eq, refreshTokens } from "@formkit/db";


export async function refreshSession(
    refreshTokenRaw: string | undefined,
    verifyRefresh: (token: string) => Promise<AccessPayload>,
) {
    if (!refreshTokenRaw) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No refresh token provided" });
    }

    const payload = await verifyRefresh(refreshTokenRaw).catch(() => null);
    if (!payload) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid refresh token" });
    }

    const tokenHash = crypto.createHash("sha256").update(refreshTokenRaw).digest("hex");
    const record = await db.query.refreshTokens.findFirst({
        where: { tokenHash, revokedAt: { isNull: true }, expiresAt: { gt: new Date() } },
    });

    if (!record) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Session no longer valid" });
    }

    const user = await db.query.users.findFirst({ where: { id: record.userId } });
    if (!user || user.tokenVersion !== payload.v) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Session no longer valid" });
    }

    await db.update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.id, record.id));

    return user;
}