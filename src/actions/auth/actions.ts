"use server";

import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCookieTranslations } from "@/i18n/server";
import { captureEvent } from "@/lib/analytics";
import { requireUserId } from "@/lib/auth";
import { syncLocaleOnSignIn } from "@/lib/locale-sync";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import {
  ForgotPasswordForm,
  forgotPasswordSchema,
  ResetPasswordForm,
  resetPasswordSchema,
  SignInForm,
  signInSchema,
  SignUpForm,
  signUpSchema,
} from "@/validations/auth-validations";

// Expected failures are returned rather than thrown: Next.js hides thrown messages from the client in production.
type ActionError = { error: string };

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const USERNAME_ATTEMPTS = 5;

// Signup asks for no username (Phase 0 / 0.10): one is derived from the email, e.g. "budi_4821",
// and the user can change it on the profile page. Always matches USERNAME_PATTERN (3–30 of a-z, 0-9, _).
function suggestUsername(email: string): string {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .slice(0, 20)
    .replace(/^_+|_+$/g, "");

  return `${base.length >= 3 ? base : "user"}_${randomInt(1000, 10000)}`;
}

async function findAvailableUsername(
  supabase: SupabaseClient,
  email: string,
): Promise<string | null> {
  for (let attempt = 0; attempt < USERNAME_ATTEMPTS; attempt++) {
    const candidate = suggestUsername(email);
    const { data: isAvailable, error } = await supabase.rpc(
      "is_username_available",
      { candidate },
    );

    if (error) {
      console.error("[auth] username check failed", error);
      return null;
    }
    if (isAvailable) return candidate;
  }

  console.error("[auth] no free username after retries");
  return null;
}

export async function signIn(
  input: SignInForm,
  next?: string,
): Promise<ActionError | undefined> {
  const t = await getCookieTranslations("auth.errors");
  const parsed = signInSchema.safeParse(input);

  if (!parsed.success) {
    return { error: t("invalidCredentials") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === "invalid_credentials") {
      return { error: t("invalidCredentials") };
    }
    if (error.code === "email_not_confirmed") {
      return { error: t("emailNotConfirmed") };
    }

    console.error("[auth] sign in failed", error);
    return { error: t("signInFailed") };
  }

  await syncLocaleOnSignIn(supabase, data.user.id);

  // Checked here rather than in the proxy, so the profile is read once per sign-in instead of on every request.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    // Onboarding is optional, so a failed lookup should not block sign-in.
    console.error("[auth] onboarding lookup failed", profileError);
  } else if (!profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  redirect(getSafeRedirectPath(next));
}

// Google login (Phase 1 / 1.12). Supabase sends the user to Google and back to /auth/callback with a PKCE ?code=;
// the code verifier is a cookie set here, so the flow must finish in this browser.
export async function signInWithGoogle(
  next?: string,
): Promise<ActionError | undefined> {
  const t = await getCookieTranslations("auth.errors");
  // Server actions always carry an Origin header (Next.js checks it against the host).
  const origin = (await headers()).get("origin");
  if (!origin) return { error: t("googleFailed") };

  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", getSafeRedirectPath(next));

  const supabase = await createClient();
  // The callback URL must be listed under Authentication → URL Configuration → Redirect URLs.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl.toString() },
  });

  if (error || !data.url) {
    console.error("[auth] google sign in failed to start", error);
    return { error: t("googleFailed") };
  }

  redirect(data.url);
}

export async function signUp(
  input: SignUpForm,
): Promise<ActionError | { needsConfirmation: true } | undefined> {
  const t = await getCookieTranslations("auth.errors");
  const parsed = signUpSchema.safeParse(input);

  if (!parsed.success) {
    return { error: t("checkForm") };
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();
  const username = await findAvailableUsername(supabase, email);

  if (!username) {
    return { error: t("signUpFailed") };
  }

  // The username travels as metadata; the handle_new_user trigger copies it into profiles.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { error: t("alreadyExists") };
    }
    if (error.code === "over_email_send_rate_limit") {
      return { error: t("tooManyAttempts") };
    }

    console.error("[auth] sign up failed", error);
    return { error: t("signUpFailed") };
  }

  // With email confirmation on, an already registered email comes back as a user without identities.
  if (data.user && data.user.identities?.length) {
    captureEvent(data.user.id, "signed_up", { method: "email" });
  }

  // No session means Supabase sent a confirmation email; the link lands on /auth/confirm.
  if (!data.session) {
    return { needsConfirmation: true };
  }

  if (data.user) await syncLocaleOnSignIn(supabase, data.user.id);

  redirect("/onboarding");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[auth] sign out failed", error);
  }

  redirect("/login");
}

export async function requestPasswordReset(
  input: ForgotPasswordForm,
): Promise<ActionError | { sent: true }> {
  const t = await getCookieTranslations("auth.errors");
  const parsed = forgotPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return { error: t("invalidEmail") };
  }

  // Server actions always carry an Origin header (Next.js checks it against the host).
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  // The default email template sends the user through Supabase and back to redirectTo with a PKCE ?code=,
  // which only works in the browser that asked for the reset (the code verifier is a cookie set here).
  // The URL must be listed under Authentication → URL Configuration → Redirect URLs, or Supabase falls back to the Site URL.
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    origin ? { redirectTo: `${origin}/auth/confirm?type=recovery` } : {},
  );

  if (error) {
    if (
      error.code === "over_email_send_rate_limit" ||
      error.code === "over_request_rate_limit"
    ) {
      return { error: t("tooManyAttempts") };
    }

    console.error("[auth] password reset request failed", error);
    return { error: t("resetEmailFailed") };
  }

  // Supabase answers the same for unknown emails, and so does this action, so the form cannot reveal who has an account.
  return { sent: true };
}

// Reached with the session that /auth/confirm created from the recovery link.
export async function updatePassword(
  input: ResetPasswordForm,
): Promise<ActionError | { success: true }> {
  const t = await getCookieTranslations("auth.errors");
  const parsed = resetPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return { error: t("checkForm") };
  }

  await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    if (error.code === "same_password") {
      return { error: t("samePassword") };
    }
    if (error.code === "weak_password") {
      return { error: t("weakPassword") };
    }
    if (error.code === "reauthentication_needed") {
      return {
        error: t("reauthenticationNeeded"),
      };
    }

    console.error("[auth] password update failed", error);
    return { error: t("updatePasswordFailed") };
  }

  return { success: true };
}
