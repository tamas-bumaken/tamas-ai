import { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Transaction from "./_components/transaction";
import WizardInput from "../_components/wizard-input";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("transactionPage.metadata");

  return { title: t("title"), description: t("description") };
}

export default function TransactionPage() {
  const t = useTranslations("transactionPage");

  return (
    <div>
      <div className="p-2 space-y-4">
        <section id="header">
          <h1 className="text-4xl font-bold text-primary-ink">{t("title")}</h1>
          <p>{t("description")}</p>
        </section>
        <WizardInput />
        <section id="content">
          <Transaction />
        </section>
      </div>
    </div>
  );
}
