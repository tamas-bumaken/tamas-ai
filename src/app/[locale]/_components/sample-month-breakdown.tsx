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
    <div
      // Hover: kilau hijau lembut menyapu dari kiri ke kanan dan halo melebar, seperti pada tombol.
      className="p-5 rounded-2xl bg-card ring-1 ring-foreground/10 sm:p-6
        bg-[linear-gradient(110deg,transparent_40%,color-mix(in_oklch,var(--primary)_12%,transparent)_50%,transparent_60%)] bg-size-[250%_100%] bg-position-[100%_0] bg-no-repeat
        transition-all duration-500 ease-out hover:bg-position-[0%_0] hover:ring-4 hover:ring-primary/15
        motion-reduce:transition-none motion-reduce:bg-none">
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
        className="flex h-3 mt-6 overflow-hidden rounded-full gap-0.5 origin-center transition-transform duration-300 motion-reduce:transition-none hover:scale-y-150">
        {SAMPLE_MONTH.categories.map((category) => (
          <div
            key={category.name}
            className={`${sampleCategorySwatch(category.name)} transition-[filter] duration-200 motion-reduce:transition-none hover:brightness-110`}
            style={{ width: `${(category.amount / businessCosts) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-4 text-base space-y-2.5">
        {SAMPLE_MONTH.categories.map((category) => (
          <li
            key={category.name}
            className="flex items-center justify-between gap-4 group/row">
            <span className="flex items-center gap-2.5 transition-colors duration-200 motion-reduce:transition-none group-hover/row:text-primary-ink">
              <span
                aria-hidden
                className={`size-2.5 rounded-full transition-transform duration-200 motion-reduce:transition-none group-hover/row:scale-150 ${sampleCategorySwatch(category.name)}`}
              />
              {tCategories(category.name)}
            </span>
            <span className="tabular-nums transition-colors duration-200 motion-reduce:transition-none group-hover/row:text-primary-ink">
              {formatIDR(category.amount)}
            </span>
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
