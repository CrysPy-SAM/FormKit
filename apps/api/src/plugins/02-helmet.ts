import fp from "fastify-plugin";
import helmet from "@fastify/helmet";
import type { FastifyInstance } from "fastify";
import { env } from "~/env.js";

export default fp(async (app: FastifyInstance) => {
    await app.register(helmet, {
        contentSecurityPolicy: env.NODE_ENV === "production" ? true : false,
    });
});