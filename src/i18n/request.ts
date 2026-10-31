import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { formats } from "./formats";
import { LOCALES } from "./routing";

// Pages get the locale from the [locale] segment. Server actions and route handlers cannot read root params,
// so they pass the locale explicitly (see ./server.ts).
export default getRequestConfig(async ({ locale }) => {
  const resolved = locale ?? (await rootParams.locale());
  if (!hasLocale(LOCALES, resolved)) notFound();

  return {
    locale: resolved,
    messages: (await import(`../../messages/${resolved}.json`)).default,
    // Dates on screen follow the user's day in Indonesia, like the rest of the app.
    timeZone: "Asia/Jakarta",
    formats,
  };
});
