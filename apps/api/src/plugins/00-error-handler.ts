import fp from "fastify-plugin";
import type { FastifyInstance, FastifyError } from "fastify";

export default fp(async (app: FastifyInstance) => {
    app.setErrorHandler((error: FastifyError, request, reply) => {
        request.log.error(
            { err: error, reqId: request.id, url: request.url },
            "Unhandled request error"
        );

        if (error.validation) {
            return reply.status(400).send({
                message: "Validation error",
                details: error.validation,
            });
        }

        const statusCode = error.statusCode ?? 500;

        reply.status(statusCode).send({
            message: statusCode === 500 ? "Internal Server Error" : error.message,
        });
    });

    app.setNotFoundHandler((request, reply) => {
        reply.status(404).send({ message: "Route not found" });
    });
});