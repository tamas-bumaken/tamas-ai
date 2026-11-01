import { useTranslations } from "next-intl";
import {
  SAMPLE_MONTH,
  businessCosts,
  cashLeft,
  ownerTaken,
  profit,
  sampleCategorySwatch,
} from "../_data/sample-month";
import { formatIDR } from "../_lib/format-idr";

export function SampleMonthBreakdown() {
  const t = useTranslations("landing.sampleMonth");
  const tCategories = useTranslations("categories");

  return (
    <div className="p-5 rounded-2xl bg-card ring-1 ring-foreground/10 sm:p-6">
      <h3 className="text-sm text-muted-foreground">{t("title")}</h3>
      <dl className="grid grid-cols-2 gap-4 mt-3">
        <div>
          <dt className="text-sm text-muted-foreground">{t("sales")}</dt>
          <dd className="text-xl font-semibold tracking-tight tabular-nums sm:text-2xl text-primary-ink">
            {formatIDR(SAMPLE_MONTH.sales)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">{t("costs")}</dt>
          <dd className="text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
            {formatIDR(businessCosts)}
          </dd>
        </div>
      </dl>
      <div
        role="img"
        aria-label={t("byCategory")}
        className="flex h-3 mt-6 overflow-hidden rounded-full gap-0.5"
      >
        {SAMPLE_MONTH.categories.map((category) => (
          <div
            key={category.name}
            className={sampleCategorySwatch(category.name)}
            style={{ width: `${(category.amount / businessCosts) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-4 text-base space-y-2.5">
        {SAMPLE_MONTH.categories.map((category) => (
          <li
            key={category.name}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-2.5">
              <span
                aria-hidden
                className={`size-2.5 rounded-full ${sampleCategorySwatch(category.name)}`}
              />
              {tCategories(category.name)}
            </span>
            <span className="tabular-nums">{formatIDR(category.amount)}</span>
          </li>
        ))}
      </ul>
      <dl className="pt-4 mt-4 text-base border-t space-y-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 font-medium">
          <dt>{t("profit")}</dt>
          <dd className="tabular-nums">{formatIDR(profit)}</dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <dt className="text-muted-foreground">{t("taken")}</dt>
          <dd className="tabular-nums">−{formatIDR(ownerTaken)}</dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 font-medium">
          <dt>{t("cashLeft")}</dt>
          <dd className="tabular-nums">{formatIDR(cashLeft)}</dd>
        </div>
      </dl>
    </div>
  );
}
