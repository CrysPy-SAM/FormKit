import { redis } from "./client.js";
import { CacheNamespace } from "./model.js";


type CacheNamespaceValue = (typeof CacheNamespace)[keyof typeof CacheNamespace];

function buildKey(namespace: CacheNamespaceValue, id: string): string {
    return `${namespace}:${id}`;
}

export async function getCached<T>(namespace: CacheNamespaceValue, id: string): Promise<T | null> {
    const cached = await redis.get(buildKey(namespace, id));
    return cached ? (JSON.parse(cached) as T) : null;
}

export async function setCached(
    namespace: CacheNamespaceValue,
    id: string,
    value: unknown,
    ttlSeconds: number,
): Promise<void> {
    await redis.set(buildKey(namespace, id), JSON.stringify(value), "EX", ttlSeconds);
}

export async function extendCacheTtl(namespace: CacheNamespaceValue, id: string, ttlSeconds: number): Promise<void> {
    await redis.expire(buildKey(namespace, id), ttlSeconds);
}

export async function invalidateCache(namespace: CacheNamespaceValue, id: string): Promise<void> {
    await redis.del(buildKey(namespace, id));
}