import { unstable_rethrow } from "next/navigation";

// A server action that calls redirect() rejects its client-side promise with a redirect error, even though
// the router still navigates. Mutation onError handlers use this to avoid flashing a failure message.
export function isNavigationError(error: unknown): boolean {
  try {
    unstable_rethrow(error);
    return false;
  } catch {
    return true;
  }
}
