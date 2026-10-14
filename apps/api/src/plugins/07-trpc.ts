import fp from "fastify-plugin";
import {
    fastifyTRPCPlugin,
    type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import type { FastifyInstance } from "fastify";
import {
    appRouter,
    createContext,
    type AppRouter,
} from "@formkit/trpc";
import { fastifyTRPCOpenApiPlugin } from "trpc-to-openapi";

export default fp(async (app: FastifyInstance) => {
    await app.register(fastifyTRPCPlugin, {
        prefix: "/trpc",
        trpcOptions: {
            router: appRouter,
            createContext,
            onError({ path, error }) {
                console.error(
                    `Error in tRPC handler on path '${path}':`,
                    error
                );
            },
        } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
    });

    await app.register(fastifyTRPCOpenApiPlugin, {
        basePath: "/api/v1",
        router: appRouter,
        createContext,
    });
});