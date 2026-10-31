import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function ClosingCta() {
  const t = useTranslations("landing.closing");

  return (
    <section
      aria-labelledby="closing-heading"
      className="px-4 pb-20 mx-auto max-w-6xl sm:px-6 sm:pb-28"
    >
      <div className="px-6 py-14 rounded-3xl bg-primary text-primary-foreground sm:px-12 sm:py-16">
        <h2
          id="closing-heading"
          className="text-3xl font-semibold tracking-tight sm:text-4xl max-w-2xl"
        >
          {t("title")}
        </h2>
        <p className="mt-4 text-lg leading-8 text-primary-foreground max-w-xl">
          {t("body")}
        </p>
        <Button
          asChild
          className="h-12 px-6 mt-8 text-base bg-foreground text-background hover:bg-foreground/85 focus-visible:ring-foreground/40"
        >
          <Link href="/register">{t("cta")}</Link>
        </Button>
      </div>
    </section>
  );
}
