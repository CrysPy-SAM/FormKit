import { z } from "zod"

const envSchema = z.object({
    RESEND_API_KEY: z
        .string({ error: "Resend API key is not confiqured" })
        .describe("Resend API keys for sending mails."),
    MAIL_FROM_ADDRESS: z
        .email({ error: "Application email is not available" })
        .describe("Company/Applicaton Email use to send all mails to the users"),
    UPLOAD_DIR: z
        .string()
        .default("./uploads")
        .describe("Directory (relative to the API process's cwd) where uploaded response files are stored on disk."),
})

function createEnv(env: NodeJS.ProcessEnv) {
    try {
        const result = envSchema.safeParse(env);
        if (!result.success) throw new Error(z.prettifyError(result.error));
        return result.data;
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : String(error));
    }
}

export const env = createEnv(process.env);