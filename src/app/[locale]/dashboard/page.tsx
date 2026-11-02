import { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CompleteProfileBanner } from "./_components/complete-profile-banner";
import DashboardContent from "./_components/dashboard-context";
import WizardInput from "./_components/wizard-input";
import AISuggestionCard from "./_components/ai-suggestion-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.metadata");

  return { title: t("title"), description: t("description") };
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  return (
    <div className="p-2 space-y-6">
      <section id="header">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
      </section>
      {/* Reads the session; renders nothing while loading so the dashboard does not shift for most users. */}
      <Suspense fallback={null}>
        <CompleteProfileBanner />
      </Suspense>
      {/* Logging is the core habit, so it is the first thing on the dashboard (Phase 1 / 1.3). */}
      <WizardInput />
      <AISuggestionCard />
      <DashboardContent />
    </div>
  );
}
