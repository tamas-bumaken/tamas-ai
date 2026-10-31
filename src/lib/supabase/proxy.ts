import { ENVIRONMENT } from "@/config/environment";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// /reset-password needs the session that a recovery link creates.
const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/reset-password",
];
const AUTH_PATHS = ["/login", "/register"];

function matchesPath(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

// `next` builds the pass-through response (the locale rewrite); it runs again when the session cookies change, so the
// page receives the refreshed request cookies.
export const supabaseProxy = async (
  request: NextRequest,
  next: (request: NextRequest) => NextResponse,
) => {
  let supabaseResponse = next(request);

  const supabase = createServerClient(
    ENVIRONMENT.supabaseUrl!,
    ENVIRONMENT.supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = next(request);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Also refreshes an expiring session, which is why this runs on every request.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims.sub);
  const { pathname, search } = request.nextUrl;

  // A redirect is a new response, so the refreshed session cookies must be copied onto it.
  const redirectTo = (url: URL) => {
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  // API routes answer 401 themselves; redirecting a fetch to an HTML page would only confuse the client.
  if (
    !isSignedIn &&
    PROTECTED_PATH_PREFIXES.some((path) => matchesPath(pathname, path))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return redirectTo(url);
  }

  if (isSignedIn && AUTH_PATHS.some((path) => matchesPath(pathname, path))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return redirectTo(url);
  }

  return supabaseResponse;
};
