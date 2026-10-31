// D1 (changed 2026-10-31 for TAMAS): Bahasa Indonesia by default, English as an option the user picks.
export const LOCALES = ["en", "id"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "id";

// URLs carry no locale; the proxy picks the app/[locale] folder from this cookie.
export const LOCALE_COOKIE = "NEXT_LOCALE";
// A year, so the choice survives between visits; signing in syncs it from profiles.locale.
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
