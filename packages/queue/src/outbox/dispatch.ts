import crypto from "node:crypto";
import { db, outboxEvents, eq, emailVerificationTokens } from "@formkit/db";
import { emailQueue } from "../queues/email.queue.js";

const VERIFICATION_TOKEN_TTL_HOURS = 24;

const EVENT_ROUTES: Record<string, (payload: any) => Promise<void>> = {

    // Email Send Event Queue
    "user:signup": async (payload: { userId: string; email: string; name: string | null }) => {

        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        const existingUnused = await db.query.emailVerificationTokens.findFirst({
            where: { userId: payload.userId, usedAt: { isNull: true }, expiresAt: { gt: new Date() } },
        });

        if (existingUnused) return;

        await db.insert(emailVerificationTokens).values({
            userId: payload.userId,
            tokenHash,
            expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000),
        });

        await emailQueue.add("send-verification-email", {
            userId: payload.userId,
            email: payload.email,
            name: payload.name,
            rawToken,
        });
    },
    "user:password_reset_requested": async (payload) => {
        await emailQueue.add("send-password-reset-email", payload);
    },
    "form:published": async (payload) => {
        await emailQueue.add("send-form-published-email", payload);
    },
    "response:submitted": async (payload) => {
        await emailQueue.add("send-response-submitted-email", payload);
    },
};


export async function dispatchOutboxEvent(eventId: string, eventType: string, payload: unknown) {
    try {
        const handler = EVENT_ROUTES[eventType];
        if (!handler) throw new Error(`No route for event type: ${eventType}`);

        await handler(payload);

        await db.update(outboxEvents)
            .set({ status: "published", publishedAt: new Date() })
            .where(eq(outboxEvents.id, eventId));
    } catch (err) {
        console.error(`Failed immediate dispatch for event ${eventId}, will retry via sweep`, err);
    }
}

export { EVENT_ROUTES };