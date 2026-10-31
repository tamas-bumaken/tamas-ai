import { Metadata } from "next";
import Link from "next/link";
import { HandCoinsIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ReactNode } from "react";
import { SiteFooter } from "../_components/site-footer";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy.metadata");

  return { title: t("title"), description: t("description") };
}

const OPERATOR = "Taru Dev";
// Set before the beta opens (see "Prasyarat sebelum beta" in docs/tasks/phase-1.md); UU PDP requires a contact channel.
const CONTACT_EMAIL: string | null = null;
const LAST_UPDATED = new Date(Date.UTC(2026, 9, 24));

const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="space-y-3 text-base leading-7 text-muted-foreground [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}

// Describes what the code actually does; update both languages together with any change to the data TAMAS collects
// or shares.
export default function PrivacyPage() {
  const t = useTranslations("privacy");
  const format = useFormatter();

  return (
    <>
      <header className="border-b">
        <div className="flex items-center h-16 px-4 mx-auto max-w-3xl sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md text-primary-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <HandCoinsIcon aria-hidden className="size-6" />
            <span className="text-xl font-bold">TAMAS</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 px-4 py-12 mx-auto space-y-10 max-w-3xl sm:px-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("lastUpdated", {
              date: format.dateTime(LAST_UPDATED, {
                dateStyle: "long",
                timeZone: "UTC",
              }),
            })}
          </p>
          <p className="text-base leading-7 text-muted-foreground">
            {t("intro", { operator: OPERATOR })}
          </p>
        </div>

        <Section title={t("beta.title")}>
          <p>{t.rich("beta.body", { strong })}</p>
        </Section>

        <Section title={t("collect.title")}>
          <ul>
            <li>{t.rich("collect.account", { strong })}</li>
            <li>{t.rich("collect.profile", { strong })}</li>
            <li>{t.rich("collect.records", { strong })}</li>
            <li>{t.rich("collect.conversations", { strong })}</li>
            <li>{t.rich("collect.settings", { strong })}</li>
            <li>{t.rich("collect.usage", { strong })}</li>
            <li>{t.rich("collect.analytics", { strong })}</li>
          </ul>
          <p>{t("collect.noSale")}</p>
        </Section>

        <Section title={t("use.title")}>
          <ul>
            <li>{t("use.run")}</li>
            <li>{t("use.ai")}</li>
            <li>{t("use.safety")}</li>
            <li>{t("use.improve")}</li>
          </ul>
        </Section>

        <Section title={t("processors.title")}>
          <ul>
            <li>
              {t.rich("processors.supabase", {
                strong,
                region: t("processors.region"),
              })}
            </li>
            <li>{t.rich("processors.vercel", { strong })}</li>
            <li>{t.rich("processors.gemini", { strong })}</li>
            <li>{t.rich("processors.googleSignIn", { strong })}</li>
            <li>{t.rich("processors.posthog", { strong })}</li>
          </ul>
          <p>{t("processors.abroad")}</p>
        </Section>

        <Section title={t("retention.title")}>
          <p>{t("retention.body")}</p>
        </Section>

        <Section title={t("rights.title")}>
          <ul>
            <li>{t.rich("rights.access", { strong })}</li>
            <li>{t.rich("rights.correct", { strong })}</li>
            <li>{t.rich("rights.delete", { strong })}</li>
            <li>{t.rich("rights.withdraw", { strong })}</li>
            <li>
              {CONTACT_EMAIL
                ? t.rich("rights.contactEmail", {
                    link: (chunks) => (
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="font-medium text-primary-ink underline-offset-4 hover:underline"
                      >
                        {chunks}
                      </a>
                    ),
                    email: CONTACT_EMAIL,
                  })
                : t("rights.contactPending")}
            </li>
          </ul>
        </Section>

        <Section title={t("security.title")}>
          <p>{t("security.body")}</p>
        </Section>

        <Section title={t("age.title")}>
          <p>{t("age.body")}</p>
        </Section>

        <Section title={t("changes.title")}>
          <p>{t("changes.body")}</p>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
