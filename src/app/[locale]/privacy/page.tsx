import { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { LEGAL_CONTACT_EMAIL, LEGAL_OPERATOR } from "@/constans/legal";
import {
  LegalPage,
  LegalSection,
  mailLink,
  strong,
} from "../_components/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy.metadata");

  return { title: t("title"), description: t("description") };
}

// Describes what the code actually does; update both languages together with any change to the data TAMAS collects
// or shares, and move LEGAL_LAST_UPDATED forward.
export default function PrivacyPage() {
  const t = useTranslations("privacy");

  return (
    <LegalPage
      title={t("title")}
      intro={t("intro", { operator: LEGAL_OPERATOR })}
    >
      <LegalSection title={t("beta.title")}>
        <p>{t.rich("beta.body", { strong })}</p>
      </LegalSection>

      <LegalSection title={t("collect.title")}>
        <ul>
          <li>{t.rich("collect.account", { strong })}</li>
          <li>{t.rich("collect.profile", { strong })}</li>
          <li>{t.rich("collect.records", { strong })}</li>
          <li>{t.rich("collect.images", { strong })}</li>
          <li>{t.rich("collect.conversations", { strong })}</li>
          <li>{t.rich("collect.suggestion", { strong })}</li>
          <li>{t.rich("collect.settings", { strong })}</li>
          <li>{t.rich("collect.usage", { strong })}</li>
          <li>{t.rich("collect.analytics", { strong })}</li>
        </ul>
        <p>{t("collect.noSale")}</p>
      </LegalSection>

      <LegalSection title={t("use.title")}>
        <ul>
          <li>{t("use.run")}</li>
          <li>{t("use.ai")}</li>
          <li>{t("use.safety")}</li>
          <li>{t("use.improve")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("processors.title")}>
        <ul>
          <li>{t.rich("processors.gemini", { strong })}</li>
          <li>{t.rich("processors.googleSignIn", { strong })}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("retention.title")}>
        <p>{t("retention.body")}</p>
      </LegalSection>

      <LegalSection title={t("rights.title")}>
        <ul>
          <li>{t.rich("rights.access", { strong })}</li>
          <li>{t.rich("rights.correct", { strong })}</li>
          <li>{t.rich("rights.delete", { strong })}</li>
          <li>{t.rich("rights.withdraw", { strong })}</li>
          <li>
            {LEGAL_CONTACT_EMAIL
              ? t.rich("rights.contactEmail", {
                  link: mailLink(LEGAL_CONTACT_EMAIL),
                  email: LEGAL_CONTACT_EMAIL,
                })
              : t("rights.contactPending")}
          </li>
        </ul>
      </LegalSection>

      <LegalSection title={t("security.title")}>
        <p>{t("security.body")}</p>
      </LegalSection>

      <LegalSection title={t("age.title")}>
        <p>{t("age.body")}</p>
      </LegalSection>

      <LegalSection title={t("changes.title")}>
        <p>{t("changes.body")}</p>
      </LegalSection>
    </LegalPage>
  );
}
