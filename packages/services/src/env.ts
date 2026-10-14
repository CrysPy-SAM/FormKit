import { z } from "zod"

const envSchema = z.object({
    GOOGLE_CLIENT_ID: z
        .string({ error: "Google Client Id is not configured." })
        .describe("Google Client id for adding google login  and signup."),
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