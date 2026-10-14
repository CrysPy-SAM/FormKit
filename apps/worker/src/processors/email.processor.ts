import type { Job } from "bullmq";
import type { EmailQueueJob, SendVerificationEmailJob, FormCreatedEmailJob, PasswordResetEmailJob, ResponseSubmittedEmailJob } from "@formkit/queue";
import { env } from "../env.js";
import { sendMail } from "@formkit/utils";

export async function processEmailJob(job: Job<EmailQueueJob>) {
    switch (job.name) {
        case "send-verification-email":
            return sendVerificationEmail(job.data as SendVerificationEmailJob);
        case "send-form-published-email":
            return sendFormPublishedEmail(job.data as FormCreatedEmailJob);
        case "send-password-reset-email":
            return sendPasswordResetEmail(job.data as PasswordResetEmailJob);
        case "send-response-submitted-email":
            return sendResponseSubmittedEmail(job.data as ResponseSubmittedEmailJob);
        default:
            throw new Error(`Unknown job name in email queue: ${job.name}`);
    }
}

async function sendVerificationEmail(data: SendVerificationEmailJob) {
    const verifyUrl = `${env.APP_BASE_URL}/verify-email?token=${data.rawToken}`;
    await sendMail({
        from: "FormKit",
        to: data.email,
        subject: "Verify your email",
        html: `<p>Hi ${data.name ?? "there"}, click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
    });
}

async function sendFormPublishedEmail(data: FormCreatedEmailJob) {
    await sendMail({
        from: "FormKit",
        to: [...data.recipients],
        subject: `Your form "${data.formTitle}" was created`,
        html: `<p>Hi there, your form <strong>${data.formTitle}</strong> is ready to edit and share.</p>`,
    });
}

async function sendPasswordResetEmail(data: PasswordResetEmailJob) {
    const resetUrl = `${env.APP_BASE_URL}/reset-password?token=${data.rawToken}`;
    await sendMail({
        to: data.email,
        subject: "Reset your password",
        html: `<p>Hi ${data.name ?? "there"}, click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });
}

async function sendResponseSubmittedEmail(data: ResponseSubmittedEmailJob) {
    if (data.recipients.length === 0) return;
    const responsesUrl = `${env.APP_BASE_URL}/forms/${data.formId}/responses`;
    await sendMail({
        from: "FormKit",
        to: data.recipients,
        subject: `New response to "${data.formTitle}"`,
        html: `<p>You've got a new response${data.respondentEmail ? ` from <strong>${data.respondentEmail}</strong>` : ""} on <strong>${data.formTitle}</strong>.</p><p><a href="${responsesUrl}">View it here</a>.</p>`,
    });
}