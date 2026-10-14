import crypto from "node:crypto";
import { db, emailVerificationTokens, eq, users } from "@formkit/db";
import { TRPCError } from "@trpc/server";
import { invalidateProfileCache } from "../users/profile.js";

export async function verifyEmail(rawToken: string) {
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const record = await db.query.emailVerificationTokens.findFirst({
        where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired verification link" });
    }

    await db.update(emailVerificationTokens)
        .set({ usedAt: new Date() })
        .where(eq(emailVerificationTokens.id, record.id));

    await db.update(users)
        .set({ emailVerified: true, emailVerifiedAt: new Date() })
        .where(eq(users.id, record.userId));

    await invalidateProfileCache(record.userId);
    
    return { success: true };
}
