import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { SAMPLE_QUICK_ENTRY } from "../_data/sample-transaction";
import { formatIDR } from "../_lib/format-idr";

export function QuickEntryExample() {
  const t = useTranslations("landing.quickEntry");
  const tCategories = useTranslations("categories");

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 px-4 text-base rounded-xl h-12 bg-card ring-1 ring-primary/40">
        <SparklesIcon
          aria-hidden
          className="size-5 shrink-0 text-primary-ink"
        />
        {t("input")}
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 px-4 py-3 text-sm rounded-xl bg-card ring-1 ring-foreground/10">
        <dt className="text-muted-foreground">{t("descriptionLabel")}</dt>
        <dd>{t("description")}</dd>
        <dt className="text-muted-foreground">{t("categoryLabel")}</dt>
        <dd>{tCategories(SAMPLE_QUICK_ENTRY.category)}</dd>
        <dt className="text-muted-foreground">{t("amountLabel")}</dt>
        <dd className="font-medium tabular-nums">
          −{formatIDR(SAMPLE_QUICK_ENTRY.amount)}
        </dd>
      </dl>
    </div>
  );
}
