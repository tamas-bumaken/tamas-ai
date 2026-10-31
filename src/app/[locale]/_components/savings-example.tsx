import { useTranslations } from "next-intl";
import {
  SAVINGS_TARGET_PERCENT,
  saved,
  savingsRatePercent,
} from "../_data/sample-month";
import { formatIDR } from "../_lib/format-idr";

// The savings card scales its bar to twice the target, so the target mark sits in the middle.
const BAR_MAX_PERCENT = SAVINGS_TARGET_PERCENT * 2;

export function SavingsExample() {
  const t = useTranslations("landing.savingsExample");
  const fillPercent = (savingsRatePercent / BAR_MAX_PERCENT) * 100;

  return (
    <div className="px-4 py-4 rounded-xl bg-card ring-1 ring-foreground/10 space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">{t("title")}</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {formatIDR(saved)}
        </p>
      </div>
      <div className="space-y-2">
        <div
          role="img"
          aria-label={t("barLabel", {
            rate: savingsRatePercent,
            target: SAVINGS_TARGET_PERCENT,
          })}
          className="relative h-2.5 rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${fillPercent}%` }}
          />
          <div className="absolute w-0.5 -translate-x-1/2 rounded-full -inset-y-1 left-1/2 bg-foreground/70 ring-2 ring-card" />
        </div>
        <div
          aria-hidden
          className="relative flex text-sm text-muted-foreground tabular-nums"
        >
          <span className="font-medium text-foreground">
            {t("rate", { rate: savingsRatePercent })}
          </span>
          <span className="absolute -translate-x-1/2 left-1/2 whitespace-nowrap">
            {t("target", { target: SAVINGS_TARGET_PERCENT })}
          </span>
        </div>
      </div>
    </div>
  );
}
