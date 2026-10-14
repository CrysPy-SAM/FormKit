import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import { redis } from "@formkit/redis";
import { FastifyInstance } from "fastify";

export default fp(async (app: FastifyInstance) => {
    await app.register(rateLimit, {
        max: 100,
        timeWindow: "1 minute",
        redis,
        keyGenerator: (request) => request.ip,
        errorResponseBuilder: (_request, context) => ({
            statusCode: 429,
            error: "Too Many Requests",
            message: `Rate limit exceeded, retry in ${context.after}`,
        }),
    });
});
