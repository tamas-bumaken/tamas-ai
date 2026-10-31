"use client";

import { getBalanceSummary } from "@/actions/transaction/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { convertToIDR, convertToSignedIDR } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { LightbulbIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { QueryError } from "./query-error";

// Above this share of income going out, the 50/30/20 split leaves no room for savings.
const HIGH_SPENDING_RATIO = 0.8;

// Concrete habits for young earners in Indonesia, not generic motivation: each one is something to do this month.
// The wording lives in "dashboard.balance.reminders.habits".
const HABIT_REMINDERS = [
  "payYourselfFirst",
  "emergencyFund",
  "debtLimit",
  "subscriptions",
  "paylater",
  "investHorizon",
] as const;

// Returns a key of "dashboard.balance.reminders".
function getReminderKey({
  totalIncome,
  totalExpense,
  savings,
}: {
  totalIncome: number;
  totalExpense: number;
  savings: number;
}) {
  if (totalIncome === 0 && totalExpense === 0) return "empty";
  if (savings < 0) return "negative";
  if (totalExpense > totalIncome * HIGH_SPENDING_RATIO) return "highSpending";

  // Derived from the data instead of the clock, so it stays pure during render and changes each time spending is logged.
  const habit =
    HABIT_REMINDERS[Math.floor(totalExpense / 1000) % HABIT_REMINDERS.length];
  return `habits.${habit}` as const;
}

export function BalanceCard() {
  const t = useTranslations("dashboard.balance");
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["balance"],
    queryFn: () => getBalanceSummary(),
  });

  return (
    <Card>
      {/* Not called a balance: it is recorded income minus expenses, not what is in the user's accounts (until wallets exist). */}
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">
          <h2>{t("title")}</h2>
        </CardTitle>
        <CardDescription className="text-xs">
          {t("description")}
        </CardDescription>
      </CardHeader>
      {/* flex-1 lets the reminder sit at the bottom when the card is stretched next to the savings card. */}
      <CardContent className="flex-1 gap-6">
        {isPending && (
          <div aria-busy="true" aria-label={t("loading")} className="space-y-6">
            <Skeleton className="w-56 max-w-full h-9 motion-reduce:animate-none sm:h-10" />
            <div className="pt-4 border-t space-y-3">
              <Skeleton className="w-full h-5 motion-reduce:animate-none" />
              <Skeleton className="w-full h-5 motion-reduce:animate-none" />
            </div>
          </div>
        )}

        {isError && (
          <QueryError message={t("loadError")} onRetry={() => refetch()} />
        )}

        {data && (
          <>
            <p className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
              {convertToSignedIDR(Number(data.savings))}
            </p>
            <dl className="pt-4 text-base border-t space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">{t("income")}</dt>
                <dd className="font-medium tabular-nums text-primary-ink">
                  +{convertToIDR(Number(data.totalIncome))}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">{t("expenses")}</dt>
                <dd className="font-medium tabular-nums">
                  −{convertToIDR(Number(data.totalExpense))}
                </dd>
              </div>
            </dl>
            <aside
              aria-label={t("reminderLabel")}
              className="flex gap-3 p-4 mt-auto rounded-lg bg-muted/60"
            >
              <LightbulbIcon
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-primary-ink"
              />
              <p className="text-sm leading-6">
                {t(
                  `reminders.${getReminderKey({
                    totalIncome: Number(data.totalIncome),
                    totalExpense: Number(data.totalExpense),
                    savings: Number(data.savings),
                  })}`,
                )}
              </p>
            </aside>
          </>
        )}
      </CardContent>
    </Card>
  );
}
