import { pgTable, uuid, varchar, timestamp, integer, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { orgs } from "./user.js";

export const planTierEnum = pgEnum("plan_tier", ["free", "pro", "business"]);
export const subStatusEnum = pgEnum("sub_status", [
    "created", "authenticated", "active", "paused", "halted", "cancelled", "completed", "expired"
]);

export const plans = pgTable("plans", {
    id: uuid("id").primaryKey().defaultRandom(),
    tier: planTierEnum("tier").notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    priceMonthlyPaise: integer("price_monthly_paise").notNull(),
    razorpayPlanId: varchar("razorpay_plan_id", { length: 100 }),
    limits: jsonb("limits").$type<{
        maxForms: number;
        maxResponsesPerMonth: number;
        maxOrgMembers: number;
        maxTeamMembers: number;
        maxTeams: number;
        customBranding: boolean;
    }>().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }).unique(),
    planId: uuid("plan_id").notNull().references(() => plans.id),
    status: subStatusEnum("status").notNull(),
    razorpayCustomerId: varchar("razorpay_customer_id", { length: 100 }),
    razorpaySubscriptionId: varchar("razorpay_subscription_id", { length: 100 }),
    razorpayPaymentMethodId: varchar("razorpay_payment_method_id", { length: 100 }), // stored mandate token
    currentPeriodEnd: timestamp("current_period_end"),
    shortUrl: varchar("short_url", { length: 500 }), // Razorpay gives a hosted checkout link — handy for MVP
    createdAt: timestamp("created_at").defaultNow(),
});

export const usageCounters = pgTable("usage_counters", {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
    metric: varchar("metric", { length: 50 }).notNull(),
    periodStart: timestamp("period_start").notNull(),
    count: integer("count").default(0),
});