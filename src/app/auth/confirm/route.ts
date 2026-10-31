import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import z from "zod";
import { syncLocaleOnSignIn } from "@/lib/locale-sync";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

const emailOtpTypeSchema = z.enum([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

type EmailOtpType = z.infer<typeof emailOtpTypeSchema>;

// Two kinds of links land here:
// - custom email templates: /auth/confirm?token_hash=...&type=email|recovery (works on any device)
// - the default templates, which go through Supabase and come back to redirectTo with a PKCE ?code=
//   (only works in the browser that started the flow), or with ?error_code=... when the link was rejected.
async function verifyLink(
  searchParams: URLSearchParams,
  type: EmailOtpType | null,
): Promise<boolean> {
  const tokenHash = searchParams.get("token_hash");
  const code = searchParams.get("code");

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) console.error("[auth/confirm] verification failed", error);
    return !error;
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error("[auth/confirm] code exchange failed", error);
    return !error;
  }

  // Expected for expired or already used links, so it is not logged as an error.
  const linkError = searchParams.get("error_code");
  if (linkError) console.warn("[auth/confirm] link rejected", linkError);

  return false;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const parsedType = emailOtpTypeSchema.safeParse(searchParams.get("type"));
  const type = parsedType.success ? parsedType.data : null;

  if (await verifyLink(searchParams, type)) {
    // A recovery link signs the user in only so they can choose a new password.
    if (type === "recovery") redirect("/reset-password");

    // A confirmed signup is a brand-new user, who always starts with onboarding.
    const isSignup = type === "signup" || type === "email";
    if (isSignup) {
      // The new account keeps the language it was created in.
      const supabase = await createClient();
      const { data } = await supabase.auth.getClaims();
      if (data?.claims.sub) await syncLocaleOnSignIn(supabase, data.claims.sub);
    }
    redirect(
      isSignup ? "/onboarding" : getSafeRedirectPath(searchParams.get("next")),
    );
  }

  if (type === "recovery") redirect("/forgot-password?error=link_expired");

  redirect("/login?error=confirmation_failed");
}
