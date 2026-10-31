import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { getUserId } from "@/lib/auth";
import Link from "next/link";
import { SignedOutActions } from "./signed-out-actions";

// Reads the session, so it must render inside <Suspense>; the fallback is the signed-out version.
export async function HeaderActions() {
  const userId = await getUserId();

  if (!userId) return <SignedOutActions />;

  const t = await getTranslations("landing.header");

  return (
    <Button
      asChild
      className="h-11 px-4 text-base bg-primary text-primary-foreground hover:bg-primary/85 sm:h-10"
    >
      <Link href="/dashboard">{t("openDashboard")}</Link>
    </Button>
  );
}
