import fp from "fastify-plugin";
import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import { env } from "~/env.js";

const allowedOrigins = env.CORS_ORIGIN?.split(",").map((o) => o.trim()) ?? [];

export default fp(async (app: FastifyInstance) => {
    await app.register(cors, {
        origin(origin, cb) {
            if (!origin) return cb(null, true);

            try {
                if (allowedOrigins.includes(origin)) {
                    return cb(null, true);
                }
                cb(new Error("Origin not allowed"), false);
            } catch {
                cb(new Error("Invalid Origin"), false);
            }
        },
        credentials: true,
    });
});