"use client";

import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { signOut } from "@/actions/auth/actions";
import { Button } from "@/components/ui/button";

// Phones have no sidebar account menu, so signing out lives on the Profile page there.
export default function SignOutButton() {
  const t = useTranslations("profile.signOut");
  const queryClient = useQueryClient();
  const [isSigningOut, startSignOut] = useTransition();

  function handleSignOut() {
    // The query cache lives for the whole browser session; without this the next user would briefly see these rows.
    queryClient.clear();
    startSignOut(() => signOut());
  }

  return (
    <Button variant="outline" onClick={handleSignOut} disabled={isSigningOut}>
      {isSigningOut ? (
        <Loader2Icon className="animate-spin" />
      ) : (
        <LogOutIcon aria-hidden="true" />
      )}
      {t("button")}
    </Button>
  );
}
