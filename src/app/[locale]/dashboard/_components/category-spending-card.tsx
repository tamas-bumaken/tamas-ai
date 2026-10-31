"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoryLabel } from "@/hooks/use-category-label";
import { convertToIDR } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { QueryError } from "./query-error";
import {
  MonthlySummary,
  useFormatPeriod,
  useMonthlySummary,
} from "./use-monthly-summary";

// Same ramp as the landing page's sample month: darkest for the biggest category.
const CATEGORY_SWATCHES = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
];
const REST_SWATCH = "bg-chart-5";
// Beyond four greens plus one grey the shades stop being distinguishable, so the tail is merged.
const MAX_ROWS = CATEGORY_SWATCHES.length + 1;

type CategoryRow = {
  // Stored category, or null for the merged tail.
  category: string | null;
  amount: number;
  swatch: string;
};

function toRows(spending: MonthlySummary["spendingByCategory"]): {
  rows: CategoryRow[];
  restCount: number;
} {
  const named =
    spending.length > MAX_ROWS
      ? spending.slice(0, CATEGORY_SWATCHES.length)
      : spending;
  const rest = spending.slice(named.length);

  const rows: CategoryRow[] = named.map(({ category, total }, index) => ({
    category,
    amount: total,
    swatch: CATEGORY_SWATCHES[index] ?? REST_SWATCH,
  }));

  if (rest.length > 0) {
    rows.push({
      category: null,
      amount: rest.reduce((sum, { total }) => sum + total, 0),
      swatch: REST_SWATCH,
    });
  }

  return { rows, restCount: rest.length };
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
  const { rows, restCount } = data
    ? toRows(data.spendingByCategory)
    : { rows: [], restCount: 0 };
  const rowName = (row: CategoryRow) =>
    row.category === null
      ? t("otherCategories", { count: restCount })
      : categoryLabel(row.category);

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
                        `${rowName(row)} ${formatShare(row.amount, total)}`,
                    )
                    .join(", "),
                })}
                className="flex h-3 overflow-hidden rounded-full gap-0.5"
              >
                {rows.map((row) => (
                  <div
                    key={row.category ?? "rest"}
                    className={row.swatch}
                    style={{ width: `${(row.amount / total) * 100}%` }}
                  />
                ))}
              </div>
              <ul className="text-base space-y-2.5">
                {rows.map((row) => (
                  <li
                    key={row.category ?? "rest"}
                    className="grid grid-cols-[1fr_auto_3rem] items-center gap-x-3"
                  >
                    <span className="flex items-center min-w-0 gap-2.5">
                      <span
                        aria-hidden
                        className={`size-2.5 shrink-0 rounded-full ${row.swatch}`}
                      />
                      <span className="truncate">{rowName(row)}</span>
                    </span>
                    <span className="tabular-nums">
                      {convertToIDR(row.amount)}
                    </span>
                    <span className="text-sm text-right tabular-nums text-muted-foreground">
                      {formatShare(row.amount, total)}
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
