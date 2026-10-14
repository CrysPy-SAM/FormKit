import type { JobsOptions } from "bullmq";

export const defaultJobOptions: JobsOptions = {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: {count:500},
    removeOnFail: false,
};