const DEFAULT_REDIRECT_PATH = "/dashboard";

// Only same-origin paths are allowed: "//evil.com" and "/\evil.com" are protocol-relative URLs to another host.
export function getSafeRedirectPath(next: string | null | undefined): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  ) {
    return DEFAULT_REDIRECT_PATH;
  }

  return next;
}
