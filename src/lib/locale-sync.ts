import "server-only";

import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALES,
  Locale,
} from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function setLocaleCookie(locale: Locale): Promise<void> {
  (await cookies()).set(LOCALE_COOKIE, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
}

// Runs right after sign-in (Phase 1 / 1.14): a saved choice follows the user to this device, and a user who never
// chose keeps the language they signed up in. Failures only log, so the language never blocks signing in.
export async function syncLocaleOnSignIn(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("profiles")
    .select("locale")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[locale] lookup failed", error);
    return;
  }

  if (hasLocale(LOCALES, data?.locale)) {
    await setLocaleCookie(data.locale);
    return;
  }

  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (!hasLocale(LOCALES, cookieLocale)) return;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ locale: cookieLocale })
    .eq("id", userId);
  if (updateError) console.error("[locale] save failed", updateError);
}
