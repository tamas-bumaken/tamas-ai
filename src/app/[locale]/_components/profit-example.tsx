import { useTranslations } from "next-intl";
import { cashLeft, ownerTaken, profit } from "../_data/sample-month";
import { formatIDR } from "../_lib/format-idr";

// A small replica of the dashboard's cash card: the walk from profit to the cash that is actually left.
export function ProfitExample() {
  const t = useTranslations("landing.profitExample");

  return (
    <div className="px-4 py-4 rounded-xl bg-card ring-1 ring-foreground/10 space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">{t("title")}</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {formatIDR(profit)}
        </p>
      </div>
      <dl className="pt-3 text-base border-t space-y-2">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">{t("taken")}</dt>
          <dd className="font-medium tabular-nums">−{formatIDR(ownerTaken)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">{t("cashLeft")}</dt>
          <dd className="font-medium tabular-nums">{formatIDR(cashLeft)}</dd>
        </div>
      </dl>
    </div>
  );
}
