import { db, outboxEvents } from "@formkit/db";
import { dispatchOutboxEvent } from "./dispatch.js";

const STALE_AFTER_MS = 10_000;

export async function reconcilePendingEvents() {
    const stale = await db.query.outboxEvents.findMany({
        where: {
            status: "pending",
            createdAt: { lt: new Date(Date.now() - STALE_AFTER_MS) },
        },
        limit: 50,
    });

    for (const event of stale) {
        await dispatchOutboxEvent(event.id, event.eventType, event.payload);
    }

    return { checked: stale.length };
}