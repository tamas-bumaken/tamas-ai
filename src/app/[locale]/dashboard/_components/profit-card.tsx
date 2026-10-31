"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { convertToIDR, convertToSignedIDR } from "@/lib/utils";
import { useFormatter, useTranslations } from "next-intl";
import { QueryError } from "./query-error";
import {
  MonthlySummary,
  useFormatPeriod,
  useMonthlySummary,
} from "./use-monthly-summary";

type ProfitPeriod = MonthlySummary["current"];
type ProfitTranslator = ReturnType<typeof useTranslations<"dashboard.profit">>;

// Truncated, not rounded: 49.9% must not read as a margin that reached 50%.
function formatPercent(value: number) {
  const whole = Math.trunc(value);

  return `${whole < 0 ? "−" : ""}${Math.abs(whole)}%`;
}

function getStatus(
  t: ProfitTranslator,
  { businessExpense, profit, profitMarginPercent }: ProfitPeriod,
) {
  if (profitMarginPercent === null) {
    return businessExpense > 0 ? t("noSales") : t("nothing");
  }

  if (profit < 0) return t("loss", { amount: convertToIDR(-profit) });

  return t("margin", { percent: formatPercent(profitMarginPercent) });
}

function formatPrevious(
  t: ProfitTranslator,
  {
    businessIncome,
    businessExpense,
    profit,
    profitMarginPercent,
  }: ProfitPeriod,
) {
  if (businessIncome === 0 && businessExpense === 0) {
    return t("previousNothing");
  }
  if (profitMarginPercent === null) {
    return t("previousNoSales", { amount: convertToSignedIDR(profit) });
  }

  return `${convertToSignedIDR(profit)} (${formatPercent(profitMarginPercent)})`;
}

export function ProfitCard() {
  const t = useTranslations("dashboard.profit");
  const format = useFormatter();
  const formatPeriod = useFormatPeriod();
  const { data, isPending, isError, refetch } = useMonthlySummary();

  const current = data?.current;

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
      <CardContent className="flex-1 gap-6">
        {isPending && (
          <div aria-busy="true" aria-label={t("loading")} className="space-y-6">
            <Skeleton className="w-56 max-w-full h-9 motion-reduce:animate-none sm:h-10" />
            <Skeleton className="w-40 h-5 motion-reduce:animate-none" />
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
            <div className="space-y-2">
              <p className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                {convertToSignedIDR(current.profit)}
              </p>
              <p className="text-sm">{getStatus(t, current)}</p>
            </div>
            <dl className="pt-4 text-base border-t space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">{t("income")}</dt>
                <dd className="font-medium tabular-nums text-primary-ink">
                  +{convertToIDR(current.businessIncome)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">{t("expense")}</dt>
                <dd className="font-medium tabular-nums">
                  −{convertToIDR(current.businessExpense)}
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
      <CardFooter className="text-xs text-muted-foreground">
        {t("note")}
      </CardFooter>
    </Card>
  );
}
