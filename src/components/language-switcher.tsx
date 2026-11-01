"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LanguagesIcon } from "lucide-react";
import { toast } from "sonner";
import { setLocale } from "@/actions/locale/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCALES } from "@/i18n/routing";

// Language names stay in their own language, so a user can find theirs whichever language is showing.
const LANGUAGE_NAMES = { en: "English", id: "Bahasa Indonesia" } as const;

// Phase 1 / 1.14. The page reloads after a switch: every route and the router cache were rendered in the old language.
export function LanguageSwitcher({
  compact = false,
}: {
  // Headers show only the language code, so the switcher fits next to the sign-in buttons on a phone.
  compact?: boolean;
}) {
  const t = useTranslations("language");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string) {
    if (next === locale) return;

    startTransition(async () => {
      const result = await setLocale(next).catch(() => null);
      if (!result || "error" in result) {
        toast.error(result?.error ?? t("saveFailed"));
        return;
      }
      window.location.reload();
    });
  }

  return (
    <Select value={locale} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger
        size={compact ? "sm" : "default"}
        aria-label={t("label")}
        className="group cursor-pointer rounded-full transition-all duration-200 motion-reduce:transition-none hover:border-primary/50 hover:bg-primary/5 hover:text-primary-ink data-[state=open]:border-primary/60 data-[state=open]:bg-primary/10">
        {/* The icon tilts on hover and while open, and pulses while the language is being saved */}
        <LanguagesIcon
          aria-hidden
          className={`transition-transform duration-200 motion-reduce:transition-none group-hover:rotate-12 group-data-[state=open]:rotate-12 ${
            isPending ? "animate-pulse" : ""
          }`}
        />
        {compact ? (
          <span className="font-semibold">{locale.toUpperCase()}</span>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      {/* Opens below the trigger: the default item-aligned position lays the list over it, so with
          Bahasa Indonesia selected the list jumped above the button. */}
      <SelectContent
        position="popper"
        align={compact ? "end" : "start"}
        className="p-1 rounded-xl shadow-lg">
        {LOCALES.map((value) => (
          <SelectItem
            key={value}
            value={value}
            lang={value}
            className="cursor-pointer rounded-lg py-2 transition-all duration-150 motion-reduce:transition-none data-highlighted:translate-x-0.5 data-highlighted:bg-primary/10 data-highlighted:text-primary-ink data-[state=checked]:font-semibold data-[state=checked]:text-primary-ink">
            {LANGUAGE_NAMES[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
