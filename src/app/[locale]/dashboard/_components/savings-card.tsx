"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { convertToIDR, convertToSignedIDR } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { QueryError } from "./query-error";
import {
  MonthlySummary,
  useFormatPeriod,
  useMonthlySummary,
} from "./use-monthly-summary";

type SavingsPeriod = MonthlySummary["current"];
type SavingsTranslator = ReturnType<
  typeof useTranslations<"dashboard.savings">
>;

// The 20 in the 50/30/20 budgeting rule.
const SAVINGS_TARGET_PERCENT = 20;
// Typical rates sit between 0 and 40%; on a 0–100 scale they would look like an empty bar.
// Doubling the target puts it in the middle of the bar.
const BAR_MAX_PERCENT = SAVINGS_TARGET_PERCENT * 2;

// Truncated, not rounded: 99.97% must not read as "spent nothing", and 19.6% must not look like the 20% target was met.
function formatPercent(value: number) {
  const whole = Math.trunc(value);

  return `${whole < 0 ? "−" : ""}${Math.abs(whole)}%`;
}

function getStatus(
  t: SavingsTranslator,
  { income, expense, saved, savingsRatePercent }: SavingsPeriod,
) {
  if (savingsRatePercent === null) {
    return expense > 0 ? t("noIncome") : t("nothing");
  }

  if (saved < 0) return t("overspent", { amount: convertToIDR(-saved) });

  const target = (income * SAVINGS_TARGET_PERCENT) / 100;

  return saved >= target
    ? t("aboveTarget", {
        amount: convertToIDR(Math.floor(saved - target)),
        target: SAVINGS_TARGET_PERCENT,
      })
    : t("belowTarget", {
        amount: convertToIDR(Math.ceil(target - saved)),
        target: SAVINGS_TARGET_PERCENT,
      });
}

function formatPrevious(
  t: SavingsTranslator,
  { income, expense, saved, savingsRatePercent }: SavingsPeriod,
) {
  if (income === 0 && expense === 0) return t("previousNothing");
  if (savingsRatePercent === null)
    return t("previousNoIncome", { amount: convertToSignedIDR(saved) });

  return `${convertToSignedIDR(saved)} (${formatPercent(savingsRatePercent)})`;
}

function SavingsRateBar({ ratePercent }: { ratePercent: number }) {
  const t = useTranslations("dashboard.savings");
  const fillPercent =
    (Math.min(Math.max(ratePercent, 0), BAR_MAX_PERCENT) / BAR_MAX_PERCENT) *
    100;
  const rateLabel = formatPercent(ratePercent);

  return (
    <div className="space-y-2">
      <div
        role="meter"
        aria-label={t("meterLabel")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.max(Math.trunc(ratePercent), 0)}
        aria-valuetext={t("meterValue", {
          rate: rateLabel,
          target: SAVINGS_TARGET_PERCENT,
        })}
        className="relative h-2.5 rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${fillPercent}%` }}
        />
        <div
          aria-hidden
          // The card-colored ring keeps the mark visible both over the green fill and the empty track.
          className="absolute w-0.5 -translate-x-1/2 rounded-full -inset-y-1 left-1/2 bg-foreground/70 ring-2 ring-card"
        />
      </div>
      <div
        aria-hidden
        className="relative flex text-sm text-muted-foreground tabular-nums"
      >
        <span className="font-medium text-foreground">
          {t("rate", { rate: rateLabel })}
        </span>
        <span className="absolute -translate-x-1/2 left-1/2 whitespace-nowrap">
          {t("target", { target: SAVINGS_TARGET_PERCENT })}
        </span>
      </div>
    </div>
  );
}

export function SavingsCard() {
  const t = useTranslations("dashboard.savings");
  const format = useFormatter();
  const formatPeriod = useFormatPeriod();
  const { data, isPending, isError, refetch } = useMonthlySummary();

  const current = data?.current;
  const isOnTarget =
    current?.savingsRatePercent != null &&
    current.savingsRatePercent >= SAVINGS_TARGET_PERCENT;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">
          <h2>{t("title")}</h2>
        </CardTitle>
        {current && (
          <CardAction className="text-sm text-muted-foreground tabular-nums">
            {formatPeriod(current)}
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="gap-6">
        {isPending && (
          <div aria-busy="true" aria-label={t("loading")} className="space-y-6">
            <Skeleton className="w-56 max-w-full h-9 motion-reduce:animate-none sm:h-10" />
            <div className="space-y-2">
              <Skeleton className="w-full h-2.5 motion-reduce:animate-none" />
              <Skeleton className="w-32 h-5 motion-reduce:animate-none" />
            </div>
            <div className="pt-4 border-t space-y-3">
              <Skeleton className="w-full h-5 motion-reduce:animate-none" />
              <Skeleton className="w-full h-5 motion-reduce:animate-none" />
              <Skeleton className="w-full h-5 motion-reduce:animate-none" />
            </div>
          </div>
        )}

        {isError && (
          <QueryError message={t("loadError")} onRetry={() => refetch()} />
        )}

        {data && current && (
          <>
            <div className="space-y-4">
              <p className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                {convertToSignedIDR(current.saved)}
              </p>
              {current.savingsRatePercent !== null && (
                <SavingsRateBar ratePercent={current.savingsRatePercent} />
              )}
              <p className="flex items-start gap-1.5 text-sm">
                {isOnTarget && (
                  <CheckIcon
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-primary-ink"
                  />
                )}
                {getStatus(t, current)}
              </p>
            </div>
            <dl className="pt-4 text-base border-t space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">{t("income")}</dt>
                <dd className="font-medium tabular-nums text-primary-ink">
                  +{convertToIDR(current.income)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">{t("spent")}</dt>
                <dd className="font-medium tabular-nums">
                  −{convertToIDR(current.expense)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">
                  {format.dateTime(
                    new Date(data.previous.startDate),
                    "monthName",
                  )}
                </dt>
                <dd className="font-medium tabular-nums">
                  {formatPrevious(t, data.previous)}
                </dd>
              </div>
            </dl>
          </>
        )}
      </CardContent>
    </Card>
  );
}
