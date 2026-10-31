import type { Locale as DateFnsLocale } from "date-fns";
import { enGB, id } from "date-fns/locale";
import { useLocale } from "next-intl";
import { Locale } from "@/i18n/routing";

// Day-month order as in the rest of the app (en-GB), and Indonesian month and day names.
const DATE_FNS_LOCALES = { en: enGB, id } satisfies Record<
  Locale,
  DateFnsLocale
>;

export function useDateFnsLocale(): DateFnsLocale {
  return DATE_FNS_LOCALES[useLocale()];
}
