import fp from "fastify-plugin";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
import { allQueues } from "@formkit/queue";
import type { FastifyInstance } from "fastify";

export default fp(async (app: FastifyInstance) => {
    const serverAdapter = new FastifyAdapter();
    createBullBoard({
        queues: allQueues.map((q) => new BullMQAdapter(q)),
        serverAdapter,
    });
    serverAdapter.setBasePath("/queues");
    app.register(serverAdapter.registerPlugin(), { prefix: "queues" });
});