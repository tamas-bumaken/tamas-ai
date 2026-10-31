"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getCookieTranslations } from "@/i18n/server";
import { captureEvent } from "@/lib/analytics";
import { requireUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  DELETE_ACCOUNT_CONFIRMATION,
  deleteAccountSchema,
  BusinessProfileForm,
  businessProfileFormSchema,
  OnboardingForm,
  onboardingFormSchema,
  ProfileForm,
  profileFormSchema,
} from "@/validations/profile-validations";

// Expected failures are returned rather than thrown: Next.js hides thrown messages from the client in production.
type ActionResult = { error: string } | { success: true };

const UNIQUE_VIOLATION = "23505";

// Form answers are strings, with "" meaning "not provided"; the database stores those as NULL.
function toBusinessProfileColumns(data: BusinessProfileForm) {
  return {
    business_name: data.business_name || null,
    business_type: data.business_type || null,
    regency: data.regency || null,
    tourist_dependence: data.tourist_dependence || null,
  };
}

async function updateOwnProfile(
  columns: Record<string, unknown>,
): Promise<{ code: string } | null> {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(columns)
    .eq("id", userId);

  if (error) console.error("[profile] update failed", error);

  return error;
}

export async function updateBusinessProfile(
  input: BusinessProfileForm,
): Promise<ActionResult> {
  const t = await getCookieTranslations("actionErrors");
  const parsed = businessProfileFormSchema.safeParse(input);

  if (!parsed.success) {
    return { error: t("checkForm") };
  }

  if (await updateOwnProfile(toBusinessProfileColumns(parsed.data))) {
    return { error: t("answersSaveFailed") };
  }

  // The dashboard banner depends on these answers.
  refresh();
  return { success: true };
}

export async function completeOnboarding(
  input: OnboardingForm,
): Promise<ActionResult | undefined> {
  const t = await getCookieTranslations("actionErrors");
  const parsed = onboardingFormSchema.safeParse(input);

  if (!parsed.success) {
    return { error: t("checkForm") };
  }

  const userId = await requireUserId();
  const error = await updateOwnProfile({
    ...toBusinessProfileColumns(parsed.data),
    onboarding_completed_at: new Date().toISOString(),
  });

  if (error) {
    return { error: t("answersSaveFailed") };
  }

  captureEvent(userId, "onboarding_completed", {});
  redirect("/dashboard");
}

export async function skipOnboarding(): Promise<ActionResult | undefined> {
  const t = await getCookieTranslations("actionErrors");
  const userId = await requireUserId();
  // Recorded so sign-in stops sending the user back here.
  const error = await updateOwnProfile({
    onboarding_completed_at: new Date().toISOString(),
  });

  if (error) {
    return { error: t("generic") };
  }

  captureEvent(userId, "onboarding_skipped", {});
  redirect("/dashboard");
}

export async function updateProfile(input: ProfileForm): Promise<ActionResult> {
  const t = await getCookieTranslations("actionErrors");
  const parsed = profileFormSchema.safeParse(input);

  if (!parsed.success) {
    return { error: t("checkForm") };
  }

  const error = await updateOwnProfile({ username: parsed.data.username });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: t("usernameTaken") };
    }

    return { error: t("profileUpdateFailed") };
  }

  // The sidebar shows the username, so the server-rendered parts need to re-render.
  refresh();
  return { success: true };
}

// Removes every trace of the user: deleting the auth user cascades to profiles, transactions, ai_usage and chats.
// The input is whatever the user typed; the schema decides whether it matches.
export async function deleteAccount(input: {
  confirmation: string;
}): Promise<ActionResult> {
  const t = await getCookieTranslations("actionErrors");
  const parsed = deleteAccountSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: t("deleteConfirmation", { word: DELETE_ACCOUNT_CONFIRMATION }),
    };
  }

  const userId = await requireUserId();
  const supabase = await createClient();

  // The id comes from the verified session, so a caller can only ever delete themselves.
  const { error: deleteError } =
    await createAdminClient().auth.admin.deleteUser(userId);

  if (deleteError) {
    console.error("[profile] account deletion failed", deleteError);
    return { error: t("accountDeleteFailed") };
  }

  // The user no longer exists, so only the local session cookies need clearing.
  const { error: signOutError } = await supabase.auth.signOut({
    scope: "local",
  });
  if (signOutError) {
    console.error("[profile] sign out after deletion failed", signOutError);
  }

  return { success: true };
}
