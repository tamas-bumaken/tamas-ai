import { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { BetaAiNotice } from "@/components/beta-ai-notice";
import { BrandLogo } from "@/components/brand-logo";
import OnboardingForm from "./_components/onboarding-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding.metadata");

  return { title: t("title"), description: t("description") };
}

export default function OnboardingPage() {
  const t = useTranslations("onboarding");

  return (
    <main className="flex flex-col items-center justify-center flex-1 min-h-screen px-4 py-10 gap-6">
      <div className="flex items-center gap-2 text-primary-ink">
        <BrandLogo className="size-9" />
        <span className="text-2xl font-bold">TAMAS</span>
      </div>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold">{t("title")}</h1>
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <BetaAiNotice />
          <OnboardingForm />
        </CardContent>
      </Card>
    </main>
  );
}
