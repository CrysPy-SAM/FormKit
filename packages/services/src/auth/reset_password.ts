import { db, eq, passwordResetTokens, users } from "@formkit/db";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { logoutAllDevices } from "./logout.js";

const SALT_ROUNDS = 12;

export async function resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const record = await db.query.passwordResetTokens.findFirst({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired reset link" });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db.transaction(async (tx) => {
        await tx.update(passwordResetTokens)
            .set({ usedAt: new Date() })
            .where(eq(passwordResetTokens.id, record.id));

        await tx.update(users)
            .set({ passwordHash })
            .where(eq(users.id, record.userId));
    });

    await logoutAllDevices(record.userId);

    return { success: true };
}