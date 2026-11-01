"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategorySwatch } from "@/constans/category-swatches";
import { BUSINESS_EXPENSE_CATEGORIES } from "@/constans/transaction-categories";
import { useCategoryLabel } from "@/hooks/use-category-label";
import { convertToIDR } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { QueryError } from "./query-error";
import { useFormatPeriod, useMonthlySummary } from "./use-monthly-summary";

// The bar keeps the category list's order, whatever the amounts: that is the order whose neighbouring colours
// stay apart for colour-blind readers. The list below it stays sorted by size, so it names every segment.
function barOrder(category: string) {
  const categories: readonly string[] = BUSINESS_EXPENSE_CATEGORIES;

  return categories.indexOf(category);
}

function formatShare(amount: number, total: number) {
  const percent = Math.trunc((amount / total) * 100);

  // A real but tiny category should not read as zero.
  return percent === 0 ? "<1%" : `${percent}%`;
}

export function CategorySpendingCard() {
  const t = useTranslations("dashboard.categorySpending");
  const categoryLabel = useCategoryLabel();
  const formatPeriod = useFormatPeriod();
  const { data, isPending, isError, refetch } = useMonthlySummary();

  const total = data?.current.businessExpense ?? 0;
  const rows = data?.spendingByCategory ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">
          <h2>{t("title")}</h2>
        </CardTitle>
        {data && (
          <CardAction className="text-sm text-muted-foreground tabular-nums">
            {formatPeriod(data.current)}
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="gap-6">
        {isPending && (
          <div aria-busy="true" aria-label={t("loading")} className="space-y-6">
            <Skeleton className="w-48 max-w-full h-9 motion-reduce:animate-none sm:h-10" />
            <Skeleton className="w-full h-3 motion-reduce:animate-none" />
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton
                  key={`category-skeleton-${index}`}
                  className="w-full h-5 motion-reduce:animate-none"
                />
              ))}
            </div>
          </div>
        )}

        {isError && (
          <QueryError message={t("loadError")} onRetry={() => refetch()} />
        )}

        {data && total === 0 && (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        )}

        {data && total > 0 && (
          <>
            <p className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
              {convertToIDR(total)}
            </p>
            <div className="space-y-4">
              <div
                role="img"
                aria-label={t("chartLabel", {
                  breakdown: rows
                    .map(
                      (row) =>
                        `${categoryLabel(row.category)} ${formatShare(row.total, total)}`,
                    )
                    .join(", "),
                })}
                className="flex h-3 overflow-hidden rounded-full gap-0.5"
              >
                {rows
                  .toSorted(
                    (a, b) => barOrder(a.category) - barOrder(b.category),
                  )
                  .map((row) => (
                    <div
                      key={row.category}
                      className={getCategorySwatch(row.category)}
                      style={{ width: `${(row.total / total) * 100}%` }}
                    />
                  ))}
              </div>
              <ul className="text-base space-y-2.5">
                {rows.map((row) => (
                  <li
                    key={row.category}
                    className="grid grid-cols-[1fr_auto_3rem] items-center gap-x-3"
                  >
                    <span className="flex items-center min-w-0 gap-2.5">
                      <span
                        aria-hidden
                        className={`size-2.5 shrink-0 rounded-full ${getCategorySwatch(row.category)}`}
                      />
                      <span className="truncate">
                        {categoryLabel(row.category)}
                      </span>
                    </span>
                    <span className="tabular-nums">
                      {convertToIDR(row.total)}
                    </span>
                    <span className="text-sm text-right tabular-nums text-muted-foreground">
                      {formatShare(row.total, total)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
