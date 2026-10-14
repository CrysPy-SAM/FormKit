import { TRPCClientError, observable, type TRPCLink, type AppRouter } from "@formkit/trpc/client";
import { getApiOrigin } from "~/lib/api-url";

let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
    if (!refreshPromise) {
        // NEXT_PUBLIC_API_URL already carries the /trpc prefix, so this goes
        // through getApiOrigin() (which strips it) to rebuild it instead of
        // appending /trpc a second time and 404-ing on /trpc/trpc/auth.refresh.
        const url = `${getApiOrigin()}/trpc/auth.refresh`;
        refreshPromise = fetch(url, {
            method: "POST",
            // tRPC's content-type handler rejects a bodyless POST that omits
            // the header outright (415), so the refresh must declare it too.
            headers: { "Content-Type": "application/json" },
            body: "{}",
            credentials: "include",
        })
            .then((res) => res.ok)
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

export const refreshLink: TRPCLink<AppRouter> = () => {
    return ({ next, op }) => {
        return observable((observer) => {
            const subscription = next(op).subscribe({
                next(value) {
                    observer.next(value);
                },
                async error(err) {
                    const isUnauthorized =
                        err instanceof TRPCClientError && err.data?.code === "UNAUTHORIZED";

                    if (isUnauthorized) {
                        const refreshed = await attemptRefresh();
                        if (refreshed) {
                            next(op).subscribe(observer);
                            return;
                        }
                        window.location.href = "/login";
                        return;
                    }
                    observer.error(err);
                },
                complete() {
                    observer.complete();
                },
            });
            return () => subscription.unsubscribe();
        });
    };
};