import { db, refreshTokens, eq, and, isNull } from "@formkit/db";
import { TRPCError } from "@trpc/server";
import { SessionInfo } from "./model.js";


export async function getMySessions(userId: string, currentTokenHash?: string): Promise<SessionInfo[]> {
    const sessions = await db.query.refreshTokens.findMany({
        where: {
            userId,
            revokedAt: { isNull: true },
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
    });

    return sessions.map((s) => ({
        id: s.id,
        userAgent: s.userAgent,
        ip: s.ip,
        createdAt: s.createdAt!.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        isCurrent: s.tokenHash === currentTokenHash,
    }));
}


export async function revokeSession(userId: string, sessionId: string) {
    const session = await db.query.refreshTokens.findFirst({
        where: { id: sessionId },
    });

    if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
    }

    if (session.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This session doesn't belong to you" });
    }

    await db.update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(and(
            eq(refreshTokens.id, sessionId),
            isNull(refreshTokens.revokedAt),
        ));

    return { success: true };
}