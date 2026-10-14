import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True once mounted on the client; false during SSR and the first hydration pass. */
export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
