import { deadLetterQueue } from "./dead-letter.queue.js";
import { emailQueue } from "./email.queue.js";

export * from "./email.queue.js";
export * from "./dead-letter.queue.js"

export const allQueues = [emailQueue, deadLetterQueue];