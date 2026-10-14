/** The API's own origin (no /trpc suffix) — for the plain REST routes
 * (file upload/download) that don't fit tRPC's JSON transport. Derived from
 * the same env var the tRPC client already uses, so it never drifts. */
export function getApiOrigin(): string {
  const trpcUrl = process.env.NEXT_PUBLIC_API_URL ?? "/trpc";
  return trpcUrl.replace(/\/trpc\/?$/, "");
}
