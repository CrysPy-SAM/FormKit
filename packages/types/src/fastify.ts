import "@fastify/cookie";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export type AccessPayload = { sub: string, v: number };

declare module "fastify" {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

        access: {
            sign(payload: AccessPayload): string;
            verify<T = AccessPayload>(token: string): T;
        };

        refresh: {
            sign(payload: AccessPayload): string;
            verify<T = AccessPayload>(token: string): T;
        };
    }

    interface FastifyRequest {
        accessJwtVerify: <T = AccessPayload>() => Promise<T>;
        refreshJwtVerify: <T = AccessPayload>() => Promise<T>;
        // user: AccessPayload | null;
    }

    interface FastifyReply {
        accessJwtSign: (payload: AccessPayload) => Promise<string>;
        refreshJwtSign: (payload: AccessPayload) => Promise<string>;
    }
}

export { };