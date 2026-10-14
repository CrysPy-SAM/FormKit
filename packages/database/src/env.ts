import { z } from "zod"

const envSchema = z.object({
    DATABASE_URL: z
        .string({ error: "Database URL is missing" })
        .describe("Postgres connection string for Drizzle."),
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development")
        .describe("Mode of your server"),
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