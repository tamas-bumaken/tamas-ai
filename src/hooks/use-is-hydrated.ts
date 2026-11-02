import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// False on the server and during hydration, true afterwards. For UI that depends on the query cache: something higher
// in the tree can fill the cache before a page section hydrates, and that section must still match the server's HTML.
export function useIsHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
