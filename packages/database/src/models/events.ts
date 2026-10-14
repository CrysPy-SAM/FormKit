import { jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const outboxEvents = pgTable("outbox_events", {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: varchar("event_type", { length: 100 }).notNull(), // 'form.published', 'response.submitted'
    aggregateId: uuid("aggregate_id").notNull(), // formId, responseId, etc
    payload: jsonb("payload").notNull(),
    status: varchar("status", { length: 20 }).default("pending"), // pending | published | failed
    createdAt: timestamp("created_at").defaultNow(),
    publishedAt: timestamp("published_at"),
});