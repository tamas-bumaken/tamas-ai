import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdvisorInsights } from "./_components/advisor-insights";
import { ClosingCta } from "./_components/closing-cta";
import { Faq } from "./_components/faq";
import { Hero } from "./_components/hero";
import { HowItWorks } from "./_components/how-it-works";
import { PrivacySection } from "./_components/privacy-section";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.metadata");

  return { title: t("title"), description: t("description") };
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <AdvisorInsights />
        <PrivacySection />
        <Faq />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}
