import "dotenv/config";
import { Redis, type RedisOptions } from "ioredis";

const globalForRedis = globalThis as {
  redis?: Redis;
};

export function createRedisClient(opts?: RedisOptions) {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";

  return new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy(times) {
      return Math.min(times * 200, 2000);
    },
    ...opts,
  });
}

export const redis =
  globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

redis.on("connect", () => {
  console.log("✅ Connected to Valkey");
});

redis.on("ready", () => {
  console.log("🚀 Valkey ready");
});

redis.on("error", (err) => {
  console.error("❌ Valkey error:", err);
});

redis.on("close", () => {
  console.log("🔌 Valkey connection closed");
});

export { Redis };
export type { RedisOptions };