import { httpLink, httpBatchStreamLink } from "@formkit/trpc/client";
import { getActiveOrgIdClient } from "~/lib/org-cookie";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
  headers?: Record<string, string>;
}

const TRPC_URL = process.env.NEXT_PUBLIC_API_URL ?? "/trpc";

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  return c({
    url: TRPC_URL,
    fetch(url, options) {
      const timeoutSignal = AbortSignal.timeout(90_000);
      const signal =
        options?.signal && typeof AbortSignal.any === "function"
          ? AbortSignal.any([options.signal, timeoutSignal])
          : timeoutSignal;

      const headers = new Headers(options?.headers);
      headers.set("Accept-Encoding", "identity");

      const activeOrgId = getActiveOrgIdClient();
      if (activeOrgId) {
        headers.set("x-org-id", activeOrgId);
      }

      if (opts?.headers) {
        for (const [key, value] of Object.entries(opts.headers)) {
          headers.set(key, value);
        }
      }

      return fetch(url,
        {
          ...options,
          headers, credentials: "include",
          signal
        });
    },
  });
};
