import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { AccessPayload } from "@formkit/types";
import { env } from "~/env.js";
import { isTokenVersionValid } from "@formkit/services"

export default fp(async (app: FastifyInstance) => {
    await app.register(jwt, {
        namespace: "access",
        secret: env.ACCESS_TOKEN_SECRET as string,
        sign: { expiresIn: "15m" },
        cookie: {
            cookieName: "access_token",
            signed: true,
        },
    });

    await app.register(jwt, {
        namespace: "refresh",
        secret: env.REFRESH_TOKEN_SECRET as string,
        sign: { expiresIn: "30d" },
    });

    if (!app.hasRequestDecorator("user")) {
        app.decorateRequest("user", null as any);
    }

    app.decorate(
        "authenticate",
        async function (request: FastifyRequest, reply: FastifyReply) {
            try {
                const payload = await request.accessJwtVerify<AccessPayload>();
                const valid = await isTokenVersionValid(payload);
                if (!valid) {
                    reply.status(401).send({ message: "Unauthorized" });
                    return;
                }
                request.user = payload;
            } catch {
                reply.status(401).send({ message: "Unauthorized" });
            }
        }
    );
});