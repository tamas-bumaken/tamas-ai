import "server-only";

import { cookies } from "next/headers";
import {
  hasLocale,
  type Messages,
  type NamespaceKeys,
  type NestedKeyOf,
} from "next-intl";
import { getTranslations } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, Locale } from "./routing";

// For server actions and route handlers, which have no [locale] segment to read.
export async function getCookieLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return hasLocale(LOCALES, value) ? value : DEFAULT_LOCALE;
}

// getTranslations for server actions and route handlers: they cannot read root params, so the cookie decides.
export async function getCookieTranslations<
  Namespace extends NamespaceKeys<Messages, NestedKeyOf<Messages>>,
>(namespace: Namespace) {
  return getTranslations({ locale: await getCookieLocale(), namespace });
}
