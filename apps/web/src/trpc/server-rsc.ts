import { cookies } from "next/headers";
import type { AppRouter } from "@formkit/trpc/client";
import { createTRPCProxyClient } from "@formkit/trpc/client";
import { createTRPCHttpBatchClientClient } from "./create-client.js";
import { ACTIVE_ORG_COOKIE } from "~/lib/org-cookie";

export async function createServerApi() {
    const cookieStore = await cookies();
    const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
    return createTRPCProxyClient<AppRouter>({
        links: [
            createTRPCHttpBatchClientClient({
                headers: {
                    cookie: cookieStore.toString(),
                    ...(activeOrgId ? { "x-org-id": activeOrgId } : {}),
                },
            }),
        ],
    });
}