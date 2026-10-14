import { db } from "@formkit/db";
import { redis } from "@formkit/redis";
import { TRPCError } from "@trpc/server";
import { orgSubscriptionInput } from "./model.js";

const SUBSCRIPTION_TTL_SECONDS = 60 * 60;
const cacheKey = (orgId: string) => `org:subscription:${orgId}`;


// Getting the orgs wiht its subscribes plan.
export async function getOrgSubscriptionWithPlan(orgId: string) {
    const subscription = await db.query.subscriptions.findFirst({
        where: { orgId },
        with: { plan: true },
    });

    if (!subscription) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No subscription found for this org" });
    }

    const plan = subscription.plan;
    if (!plan) {
        console.error(`Subscription ${subscription.id} missing plan — data integrity issue`);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Subscription missing plan" });
    }

    return { ...subscription, plan };
}

export async function getOrgSubscription(orgId: string): Promise<orgSubscriptionInput> {
    const key = cacheKey(orgId);

    const cached = await redis.get(key);
    if (cached) {
        await redis.expire(key, SUBSCRIPTION_TTL_SECONDS);
        return JSON.parse(cached) as orgSubscriptionInput;
    }

    const sub = await getOrgSubscriptionWithPlan(orgId);

    const summary: orgSubscriptionInput = {
        planTier: sub.plan.tier,
        planName: sub.plan.name,
        status: sub.status,
        limits: sub.plan.limits,
    };

    await redis.set(key, JSON.stringify(summary), "EX", SUBSCRIPTION_TTL_SECONDS);

    return summary;
}

export async function invalidateSubscriptionCache(orgId: string) {
    await redis.del(cacheKey(orgId));
}