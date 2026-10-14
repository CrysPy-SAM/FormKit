import fp from "fastify-plugin";
import { generateOpenApiDocument } from "trpc-to-openapi";
import type { FastifyInstance } from "fastify";
import ScalarApiReference from "@scalar/fastify-api-reference";
import { appRouter } from "@formkit/trpc";
import { env } from "~/env.js";

export default fp(async (app: FastifyInstance) => {
    const document = generateOpenApiDocument(appRouter, {
        title: "FormKit",
        description: "REST-compatible API generated from tRPC procedures",
        version: "1.0.0",
        baseUrl: env.OPEN_API_BASE_URL,
    });

    app.get("/openapi.json", async () => document);

    app.register(ScalarApiReference, {
        routePrefix: "/doc",
        configuration: {
            title: 'Our API Reference',
            url: "/openapi.json",
            layout: "modern",
        },
    });
});