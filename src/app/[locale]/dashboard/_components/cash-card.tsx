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
import { LightbulbIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { getCashInsightKey } from "./cash-insight";
import { QueryError } from "./query-error";
import { useFormatPeriod, useMonthlySummary } from "./use-monthly-summary";

function CashRow({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={`font-medium tabular-nums ${positive ? "text-primary-ink" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

// Walks from the profit to the cash left, so the owner sees why a profitable month can still leave little money.
export function CashCard() {
  const t = useTranslations("dashboard.cash");
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
      {/* flex-1 lets the insight sit at the bottom when the card is stretched next to the profit card. */}
      <CardContent className="flex-1 gap-6">
        {isPending && (
          <div aria-busy="true" aria-label={t("loading")} className="space-y-6">
            <Skeleton className="w-56 max-w-full h-9 motion-reduce:animate-none sm:h-10" />
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

        {current && (
          <>
            <p className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
              {convertToSignedIDR(current.cashLeft)}
            </p>
            <dl className="pt-4 text-base border-t space-y-3">
              <CashRow
                label={t("profit")}
                value={convertToSignedIDR(current.profit)}
              />
              {current.ownerCapital > 0 && (
                <CashRow
                  label={t("capital")}
                  value={`+${convertToIDR(current.ownerCapital)}`}
                  positive
                />
              )}
              {current.loanInstallments > 0 && (
                <CashRow
                  label={t("loan")}
                  value={`−${convertToIDR(current.loanInstallments)}`}
                />
              )}
              <CashRow
                label={t("withdrawals")}
                value={`−${convertToIDR(current.ownerWithdrawals)}`}
              />
              <CashRow
                label={t("ceremony")}
                value={`−${convertToIDR(current.ceremony)}`}
              />
            </dl>
            <aside
              aria-label={t("insightLabel")}
              className="flex gap-3 p-4 mt-auto rounded-lg bg-muted/60"
            >
              <LightbulbIcon
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-primary-ink"
              />
              <p className="text-sm leading-6">
                {t(`insights.${getCashInsightKey(current)}`, {
                  taken: convertToIDR(current.ownerTaken),
                  profit: convertToIDR(current.profit),
                })}
              </p>
            </aside>
          </>
        )}
      </CardContent>
    </Card>
  );
}
