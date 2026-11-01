import { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { LEGAL_CONTACT_EMAIL, LEGAL_OPERATOR } from "@/constans/legal";
import {
  LegalPage,
  LegalSection,
  mailLink,
  textLink,
} from "../_components/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("terms.metadata");

  return { title: t("title"), description: t("description") };
}

// Keep it in step with what the app really does (limits, export, deletion), in both languages, and move
// LEGAL_LAST_UPDATED forward when it changes.
export default function TermsPage() {
  const t = useTranslations("terms");
  const operator = { operator: LEGAL_OPERATOR };

  return (
    <LegalPage title={t("title")} intro={t("intro", operator)}>
      <LegalSection title={t("service.title")}>
        <ul>
          <li>{t("service.what")}</li>
          <li>{t("service.beta")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("account.title")}>
        <ul>
          <li>{t("account.age")}</li>
          <li>{t("account.accurate")}</li>
          <li>{t("account.secure")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("records.title")}>
        <ul>
          <li>{t.rich("records.own", { link: textLink("/privacy") })}</li>
          <li>{t("records.control")}</li>
          <li>{t("records.others")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("ai.title")}>
        <ul>
          <li>{t("ai.mistakes")}</li>
          <li>{t("ai.figures")}</li>
          <li>{t("ai.advice")}</li>
          <li>{t("ai.beta")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("use.title")}>
        <ul>
          <li>{t("use.law")}</li>
          <li>{t("use.content")}</li>
          <li>{t("use.attack")}</li>
          <li>{t("use.limits")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("limits.title")}>
        <p>{t("limits.body")}</p>
      </LegalSection>

      <LegalSection title={t("ip.title")}>
        <p>{t("ip.body", operator)}</p>
      </LegalSection>

      <LegalSection title={t("termination.title")}>
        <ul>
          <li>{t("termination.you")}</li>
          <li>{t("termination.us")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("liability.title")}>
        <p>{t("liability.body", operator)}</p>
      </LegalSection>

      <LegalSection title={t("changes.title")}>
        <p>{t("changes.body")}</p>
      </LegalSection>

      <LegalSection title={t("law.title")}>
        <p>{t("law.body")}</p>
      </LegalSection>

      <LegalSection title={t("contact.title")}>
        <p>
          {LEGAL_CONTACT_EMAIL
            ? t.rich("contact.withEmail", {
                link: mailLink(LEGAL_CONTACT_EMAIL),
                email: LEGAL_CONTACT_EMAIL,
              })
            : t("contact.pending", operator)}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
