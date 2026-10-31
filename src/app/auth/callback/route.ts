import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { captureEvent } from "@/lib/analytics";
import { syncLocaleOnSignIn } from "@/lib/locale-sync";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

// The first sign-in creates the user moments before this callback runs; later sign-ins only move last_sign_in_at.
const NEW_USER_WINDOW_MS = 60_000;

// Google login (Phase 1 / 1.12) comes back here with a PKCE ?code=, or with ?error= when the user cancelled
// or Google refused. New and returning users who never finished onboarding go there first, like email sign-in.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    // Expected when the user cancels on Google's screen, so it is not logged as an error.
    console.warn("[auth/callback] no code", searchParams.get("error"));
    redirect("/login?error=google_failed");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] code exchange failed", error);
    redirect("/login?error=google_failed");
  }

  const { user } = data;
  if (Date.now() - Date.parse(user.created_at) < NEW_USER_WINDOW_MS) {
    captureEvent(user.id, "signed_up", { method: "google" });
  }

  await syncLocaleOnSignIn(supabase, user.id);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    // Onboarding is optional, so a failed lookup should not block sign-in.
    console.error("[auth/callback] onboarding lookup failed", profileError);
  } else if (!profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  redirect(getSafeRedirectPath(searchParams.get("next")));
}
