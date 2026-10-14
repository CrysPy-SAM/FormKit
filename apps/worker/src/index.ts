import { Queue, Worker } from "bullmq";
import { connection, reconcilePendingEvents, deadLetterQueue } from "@formkit/queue";
import { processEmailJob } from "./processors/index.js";
import { createLogger } from "@formkit/logger";

const logger = createLogger({ service: "worker" });

// reconcile sweep — runs rarely, only catches events dispatch.ts couldn't push immediately
const reconcileQueue = new Queue("outbox-reconcile", { connection });
await reconcileQueue.upsertJobScheduler(
    "outbox-reconcile-poll",
    { every: 60_000 }, // once a minute
    { name: "reconcile", data: {} },
);
const reconcileWorker = new Worker("outbox-reconcile", async () => {
    const result = await reconcilePendingEvents();
    if (result.checked > 0) {
        logger.warn({ count: result.checked }, "Reconcile swept stale pending events");
    }
}, { connection });


// normal work queues.
// new worker are add below with addinf them into array as well
const emailWorker = new Worker("email", processEmailJob, { connection, concurrency: 5 });

// workers array
const workers = [emailWorker, reconcileWorker];

// Dead Letter Queue function
function attachDeadLetterHandling(worker: Worker, queueName: string) {

    worker.on("completed", (job) => {
        logger.info(
            { jobId: job.id, queue: queueName, jobName: job.name, durationMs: Date.now() - job.timestamp },
            "Job completed",
        );
    });

    worker.on("failed", async (job, err) => {
        if (!job) return;
        logger.error({ jobId: job.id, queue: queueName, err: err.message }, "Job failed");
        if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
            await deadLetterQueue.add("dead-job", {
                originalQueue: queueName,
                originalJobId: job.id!,
                jobName: job.name,
                data: job.data,
                failedReason: err.message,
                attemptsMade: job.attemptsMade,
                failedAt: new Date().toISOString(),
            });
            logger.warn({ jobId: job.id, queue: queueName }, "Job moved to dead-letter queue");
        }
    });
}

// attaching DQL instance on all workers
for (const worker of workers) {
    attachDeadLetterHandling(worker, worker.name);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, async () => {
        await Promise.all(workers.map((w) => w.close()));
        process.exit(0);
    });
}