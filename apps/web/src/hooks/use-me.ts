import { trpc } from "~/trpc/client";

export function useMe() {
  return trpc.user.me.useQuery(undefined, { retry: false });
}
