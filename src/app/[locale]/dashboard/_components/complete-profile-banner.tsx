import Link from "next/link";
import { SparklesIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";

// Shown to users who skipped onboarding, since AI Advisor stays generic without these answers.
export async function CompleteProfileBanner() {
  const profile = await getCurrentProfile();

  if (profile.business_name !== null || profile.business_type !== null) {
    return null;
  }

  const t = await getTranslations("dashboard.completeProfile");

  return (
    <aside className="flex flex-col gap-3 p-4 border rounded-lg border-primary/40 bg-accent sm:flex-row sm:items-center">
      <SparklesIcon
        className="hidden size-5 shrink-0 text-primary-ink sm:block"
        aria-hidden="true"
      />
      <p className="flex-1 text-sm">{t("body")}</p>
      <Button asChild size="sm" variant="outline" className="self-start">
        <Link href="/dashboard/profile">{t("cta")}</Link>
      </Button>
    </aside>
  );
}
