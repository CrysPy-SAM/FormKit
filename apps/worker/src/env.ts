import { z } from "zod"

const envSchema = z.object({
    APP_BASE_URL: z
        .string({ error: "Application Base URL is not defined." })
        .describe("Applicatio base URL."),
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