import { z } from "zod"

const envSchema = z.object({
    PORT: z
        .coerce.number({ error: "SERVER PORT no is required" })
        .default(8080)
        .describe("Port no where server will run."),
    CORS_ORIGIN: z
        .string({ error: "Origin is not whitelisted yet." })
        .describe("URL where frontend is running or URL for whitelisting."),
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development")
        .describe("Mode of your server"),
    COOKIE_SECRET: z
        .string({ error: "Cookie secret is not set" })
        .describe("Cookie secret for setting the cookie on client."),
    ACCESS_TOKEN_SECRET: z
        .string({ error: "Access Token Secret is missing" })
        .describe("Access Token secret for assigning the access token to user."),
    REFRESH_TOKEN_SECRET: z
        .string({ error: "Refresh Token Secret is missing" })
        .describe("Refresh Token secret for assigning the access token to user."),
    OPEN_API_BASE_URL: z
        .string()
        .default("http://localhost:8080/api/v1")
        .describe("exposed URL in form of openapi/swagger/scaler for testing purpose via clients")
});

function createEnv(env: NodeJS.ProcessEnv) {
    const safeParseResult = envSchema.safeParse(env);
    if (!safeParseResult.success) throw new Error(z.prettifyError(safeParseResult.error));
    return safeParseResult.data;
}

export const env = createEnv(process.env);