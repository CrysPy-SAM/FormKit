import crypto from "node:crypto";
import { z } from "zod"
import { forgetPasswordInput } from "./model.js";
import { TRPCError } from "@trpc/server";
import { db, outboxEvents, passwordResetTokens } from "@formkit/db";
import { dispatchOutboxEvent } from "@formkit/queue";

const RESET_TOKEN_TTL_HOURS = 1;

export async function forgetPassword(input: z.infer<typeof forgetPasswordInput>) {
    const user = await db.query.users.findFirst({ where: { email: input.email } });

    if (!user || !user.passwordHash) {
        return { message: "Account is linked with google.", success: true };
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const { eventPayload, outboxEventId } = await db.transaction(async (tx) => {
        await tx.insert(passwordResetTokens).values({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000),
        });

        const eventPayload = { userId: user.id, email: user.email, name: user.name, rawToken };

        const [event] = await tx.insert(outboxEvents).values({
            eventType: "user:password_reset_requested",
            aggregateId: user.id,
            payload: eventPayload,
        }).returning();

        if (!event) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create outbox event" });

        return { eventPayload, outboxEventId: event.id }
    });

    void dispatchOutboxEvent(outboxEventId!, "user:password_reset_requested", eventPayload!);

    return { message: "Password reset link sent to you email.", success: true };

}   