"use client";

import { useQuery } from "@tanstack/react-query";
import { LightbulbIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { getProfitTrend } from "@/actions/transaction/actions";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProjectionInsight } from "@/lib/profit-trend";
import { convertToIDR, convertToSignedIDR } from "@/lib/utils";
import { ProfitTrendChart } from "./profit-trend-chart";
import { QueryError } from "./query-error";

type ProfitTrend = Awaited<ReturnType<typeof getProfitTrend>>;

// A plus sign reads oddly in a sentence, so only a loss keeps its sign.
function formatInSentence(amount: number) {
  return amount < 0 ? convertToSignedIDR(amount) : convertToIDR(amount);
}

function ProjectionNote({ months, projection }: ProfitTrend) {
  const t = useTranslations("dashboard.trend.insights");

  if (projection.status === "too_early") return t("tooEarly");
  if (projection.status === "month_end") return t("monthEnd");
  if (projection.status === "no_sales") return t("noSales");

  const previous = months[months.length - 2];
  const { key, takenMoreThanProfit } = getProjectionInsight(
    projection,
    previous,
  );

  return (
    <>
      {t(key, {
        // The loss sentence says "rugi" itself, so it takes the size of the loss.
        projected: convertToIDR(Math.abs(projection.profit)),
        previous: formatInSentence(previous.profit),
      })}
      {takenMoreThanProfit &&
        ` ${t("takenMoreThanProfit", {
          taken: convertToIDR(projection.ownerTaken),
        })}`}
    </>
  );
}

// Under "balance" so every invalidation of the balance also refreshes the trend.
export function ProfitTrendCard() {
  const t = useTranslations("dashboard.trend");
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["balance", "profit-trend"],
    queryFn: () => getProfitTrend(),
  });

  const hasAnyRecords = data?.months.some(({ hasRecords }) => hasRecords);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">
          <h2>{t("title")}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-6">
        {isPending && (
          <Skeleton
            aria-busy="true"
            aria-label={t("loading")}
            className="w-full h-48 motion-reduce:animate-none"
          />
        )}

        {isError && (
          <QueryError message={t("loadError")} onRetry={() => refetch()} />
        )}

        {data && !hasAnyRecords && (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        )}

        {data && hasAnyRecords && (
          <>
            <ProfitTrendChart {...data} />
            <aside
              aria-label={t("insightLabel")}
              className="flex gap-3 p-4 rounded-lg bg-muted/60"
            >
              <LightbulbIcon
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-primary-ink"
              />
              <p className="text-sm leading-6">
                <ProjectionNote {...data} />
              </p>
            </aside>
          </>
        )}
      </CardContent>
      {data?.projection.status === "ready" && (
        <CardFooter className="text-sm text-muted-foreground">
          {t("note")}
        </CardFooter>
      )}
    </Card>
  );
}
