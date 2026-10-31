import { NextRequest, NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES } from "./routing";

// Route handlers live outside app/[locale] and must keep their URLs (email and OAuth links point at /auth/*).
const UNLOCALIZED_PATH_PREFIXES = ["/api/", "/auth/"];

// Pages live under app/[locale] while URLs stay unprefixed, so the request is rewritten to the cookie's folder.
// next-intl's own middleware is not used: it either ignores the cookie (localeDetection off) or lets a browser set
// to English override the Indonesian default (localeDetection on).
export function localizedNext(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  if (UNLOCALIZED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next({ request });
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = hasLocale(LOCALES, cookieLocale)
    ? cookieLocale
    : DEFAULT_LOCALE;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url, { request });
}
