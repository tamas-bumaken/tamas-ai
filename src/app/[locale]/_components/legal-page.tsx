import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LEGAL_LAST_UPDATED } from "@/constans/legal";
import { SiteFooter } from "./site-footer";

export const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

export function textLink(href: string) {
  const TextLink = (chunks: ReactNode) => (
    <Link
      href={href}
      className="font-medium text-primary-ink underline-offset-4 hover:underline"
    >
      {chunks}
    </Link>
  );

  return TextLink;
}

export function mailLink(email: string) {
  const MailLink = (chunks: ReactNode) => (
    <a
      href={`mailto:${email}`}
      className="font-medium text-primary-ink underline-offset-4 hover:underline"
    >
      {chunks}
    </a>
  );

  return MailLink;
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="space-y-3 text-base leading-7 text-muted-foreground [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}

// The frame of the Privacy Policy and the Terms of Service: header, title, date, intro, sections and footer.
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  const t = useTranslations("legal");
  const format = useFormatter();

  return (
    <>
      <header className="border-b">
        <div className="flex items-center h-16 px-4 mx-auto max-w-3xl sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-primary-ink rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <BrandLogo className="size-10" />
            {/* On phones the name does not fit beside the language switcher and the button, but stays the link's label. */}
            <span className="text-xl font-bold max-sm:sr-only">TAMAS</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 px-4 py-12 mx-auto space-y-10 max-w-3xl sm:px-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {t("lastUpdated", {
              date: format.dateTime(LEGAL_LAST_UPDATED, {
                dateStyle: "long",
                timeZone: "UTC",
              }),
            })}
          </p>
          <p className="text-base leading-7 text-muted-foreground">{intro}</p>
        </div>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
