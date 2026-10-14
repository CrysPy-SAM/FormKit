import { Queue } from "bullmq";
import { connection } from "../connection.js";

export type DeadLetterJob = {
    originalQueue: string;
    originalJobId: string;
    jobName: string;
    data: unknown;
    failedReason: string;
    attemptsMade: number;
    failedAt: string;
};

export const deadLetterQueue = new Queue<DeadLetterJob>("dead-letter", {
    connection,
    defaultJobOptions: {
        removeOnComplete: false,
        removeOnFail: false,
    },
});