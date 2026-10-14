import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import { FastifyInstance } from "fastify";
import { env } from "~/env.js";

export default fp(async (app: FastifyInstance) => {
    await app.register(cookie, {
        secret: env.COOKIE_SECRET,
        hook: "onRequest",
        parseOptions: {},
    });
});
