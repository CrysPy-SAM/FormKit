import { z } from "zod"

const envSchema = z.object({
    REDIS_URL: z
        .string({ error: "Redis URL is missing" })
        .describe("REDIS connection string for QUEUE Workers."),
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