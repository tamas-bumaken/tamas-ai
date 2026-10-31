"use client";

import { getTransactions } from "@/actions/transaction/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, convertToIDR } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useCategoryLabel } from "@/hooks/use-category-label";
import { QueryError } from "./query-error";

const RECENT_LIMIT = 5;

export function RecentTransactions() {
  const t = useTranslations("dashboard.recent");
  const format = useFormatter();
  const categoryLabel = useCategoryLabel();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["transactions", "recent"],
    queryFn: () => getTransactions({ page: 1, limit: RECENT_LIMIT }),
  });

  const transactions = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t("title")}</h2>
        </CardTitle>
        <CardAction>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-my-2.5 h-11 md:-my-1 md:h-8"
          >
            <Link href="/dashboard/transaction">{t("viewAll")}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isPending && (
          <ul aria-busy="true" aria-label={t("loading")} className="divide-y">
            {Array.from({ length: RECENT_LIMIT }, (_, index) => (
              <li
                key={`recent-skeleton-${index}`}
                className="flex items-center justify-between py-3 gap-4"
              >
                <div className="space-y-2">
                  <Skeleton className="w-40 h-4 motion-reduce:animate-none" />
                  <Skeleton className="w-20 h-3 motion-reduce:animate-none" />
                </div>
                <Skeleton className="w-24 h-4 motion-reduce:animate-none" />
              </li>
            ))}
          </ul>
        )}

        {isError && (
          <QueryError message={t("loadError")} onRetry={() => refetch()} />
        )}

        {data && transactions.length === 0 && (
          <p className="py-6 text-muted-foreground">{t("empty")}</p>
        )}

        {transactions.length > 0 && (
          <ul className="divide-y">
            {transactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-center justify-between py-3 gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {transaction.description ||
                      categoryLabel(transaction.category)}
                  </p>
                  {transaction.description && (
                    <p className="text-xs truncate text-muted-foreground">
                      {categoryLabel(transaction.category)}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "font-medium tabular-nums",
                      transaction.type === "income" && "text-primary-ink",
                    )}
                  >
                    {transaction.type === "income" ? "+" : "−"}
                    {convertToIDR(Number(transaction.amount))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format.dateTime(new Date(transaction.date), "day")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
