import z from "zod";
import { publicProcedure, router } from "../../trpc.js";

export const healthRouter = router({
    getHealth: publicProcedure
        .meta({ openapi: { method: "GET", path: "/health", tags: ["Health"] } })
        .input(z.void())
        .output(z.object({ status: z.string() }))
        .query(async () => {
            return {
                status: "healthy",
            };
        }),
});