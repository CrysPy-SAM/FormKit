import { Queue } from "bullmq";
import { connection } from "../connection.js";
import { defaultJobOptions } from "../defaults.js";

export type SendVerificationEmailJob = {
    userId: string;
    email: string;
    name: string | null;
    rawToken: string;
};

export type PasswordResetEmailJob = {
    userId: string;
    email: string;
    name: string | null;
    rawToken: string;
}

export type FormCreatedEmailJob = {
    orgId: string;
    formId: string;
    formTitle: string;
    recipients: string[];
};

export type ResponseSubmittedEmailJob = {
    formId: string;
    formTitle: string;
    responseId: string;
    respondentEmail: string | null;
    recipients: string[];
};

export type EmailQueueJob = SendVerificationEmailJob | FormCreatedEmailJob | PasswordResetEmailJob | ResponseSubmittedEmailJob;

export const emailQueue = new Queue<EmailQueueJob>("email", {
    connection,
    defaultJobOptions,
});