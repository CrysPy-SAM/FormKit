import "@formkit/types";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { AccessPayload } from "@formkit/types";
import { isTokenVersionValid } from "@formkit/services";

export async function createContext({ req, res }: CreateFastifyContextOptions) {
    let user: AccessPayload | null = null;
    const orgId = req.headers["x-org-id"] as string | undefined;

    if (req.cookies?.access_token) {
        try {
            const payload = await req.accessJwtVerify<AccessPayload>();
            const valid = await isTokenVersionValid(payload);
            user = valid ? payload : null;
        } catch {
            user = null;
        }
    }

    return { req, res, user, orgId, requestId: req.id, logger: req.log };
}

export type Context = Awaited<ReturnType<typeof createContext>>;