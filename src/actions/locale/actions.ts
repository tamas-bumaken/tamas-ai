"use server";

import z from "zod";
import { LOCALES } from "@/i18n/routing";
import { getCookieTranslations } from "@/i18n/server";
import { captureEvent } from "@/lib/analytics";
import { getUserId } from "@/lib/auth";
import { setLocaleCookie } from "@/lib/locale-sync";
import { createClient } from "@/lib/supabase/server";

// Expected failures are returned rather than thrown: Next.js hides thrown messages from the client in production.
type ActionResult = { error: string } | { success: true };

// Public on purpose: the landing and sign-in pages switch language too. Signed-in users also get it saved to their
// profile, so it follows them to other devices and the push messages use it.
export async function setLocale(locale: string): Promise<ActionResult> {
  const t = await getCookieTranslations("language");
  const parsed = z.enum(LOCALES).safeParse(locale);
  if (!parsed.success) return { error: t("saveFailed") };

  const userId = await getUserId();
  if (userId) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ locale: parsed.data })
      .eq("id", userId);

    if (error) {
      console.error("[locale] failed to save language", error);
      return { error: t("saveFailed") };
    }

    captureEvent(userId, "locale_changed", { locale: parsed.data });
  }

  await setLocaleCookie(parsed.data);
  return { success: true };
}
