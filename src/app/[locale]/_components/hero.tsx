import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AdvisorPreview } from "./advisor-preview";

export function Hero() {
  const t = useTranslations("landing.hero");

  return (
    <section
      aria-labelledby="hero-heading"
      className="px-4 pt-12 pb-20 mx-auto max-w-6xl sm:px-6 sm:pt-20 sm:pb-28"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <h1
            id="hero-heading"
            className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            {t("title")}
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-xl">
            {t("body")}
          </p>
          <div className="flex flex-col gap-3 mt-10 sm:flex-row">
            <Button
              asChild
              className="h-12 px-6 text-base bg-primary text-primary-foreground hover:bg-primary/85"
            >
              <Link href="/register">{t("createAccount")}</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-6 text-base">
              <Link href="/login">{t("haveAccount")}</Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">{t("note")}</p>
        </div>
        <AdvisorPreview />
      </div>
    </section>
  );
}
