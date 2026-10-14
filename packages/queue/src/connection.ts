import { Redis } from "ioredis";
import { env } from "./env.js";

export const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
});