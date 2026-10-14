import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development")
        .describe("Mode of your server"),
    LOG_LEVEL: z.enum(["info", "debug", "warn", "error"]).default("debug").describe("Logger level for logging"),
});

function createEnv(env: NodeJS.ProcessEnv) {
    const safeParseResult = envSchema.safeParse(env);
    if (!safeParseResult.success) throw new Error(z.prettifyError(safeParseResult.error));
    return safeParseResult.data;
}

export const env = createEnv(process.env);