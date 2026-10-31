"use client";

import { useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { signInWithGoogle } from "@/actions/auth/actions";
import { isNavigationError } from "@/lib/navigation-error";
import { Button } from "@/components/ui/button";
import { FieldError, FieldSeparator } from "@/components/ui/field";

// Google's "G" mark, kept in its brand colors as Google's sign-in branding guidelines require.
function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-4">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

// Sits above the email form on sign-in and sign-up: Google creates the account on first use (Phase 1 / 1.12).
export default function GoogleSignInButton({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(undefined);
    startTransition(async () => {
      try {
        // On success the action redirects to Google, so only failures return.
        const result = await signInWithGoogle(next);
        if (result?.error) setError(result.error);
      } catch (thrown) {
        if (isNavigationError(thrown)) return;
        setError(t("errors.googleFailed"));
      }
    });
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? <Loader2Icon className="animate-spin" /> : <GoogleMark />}
        {t("google.continue")}
      </Button>
      {error && <FieldError>{error}</FieldError>}
      {/* The separator label sits on the card, not the page background. */}
      <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
        {t("google.orEmail")}
      </FieldSeparator>
    </div>
  );
}
