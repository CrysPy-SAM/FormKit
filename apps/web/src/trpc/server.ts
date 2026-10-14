import type { AppRouter } from "@formkit/trpc/client";
import { createTRPCProxyClient } from "@formkit/trpc/client";
import { createTRPCHttpBatchClientClient } from "~/trpc/create-client";
import { refreshLink } from "./refresh-link";

export const api = createTRPCProxyClient<AppRouter>({
  links: [refreshLink, createTRPCHttpBatchClientClient()],
});

export const apiStreaming = createTRPCProxyClient<AppRouter>({
  links: [refreshLink, createTRPCHttpBatchClientClient({ enableStreaming: true })],
});