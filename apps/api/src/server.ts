import fastify, { type FastifyInstance } from "fastify";
import autoload from "@fastify/autoload";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "./config/logger.js";

// Setting all plugins
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fastify Server Instance
const server = fastify({
    loggerInstance: logger,
    genReqId: () => crypto.randomUUID(),
    pluginTimeout: 30000,
});

// Autoload all plugins from plogind folder.
server.register(autoload, {
    dir: path.join(__dirname, "plugins"),
});

// Server health route
server.get("/health", (request, reply) => {
    // request.log.debug({ check: "health" }, "Health check hit");
    return reply.status(200).send({ message: "Server is running...!" });
});

export default server