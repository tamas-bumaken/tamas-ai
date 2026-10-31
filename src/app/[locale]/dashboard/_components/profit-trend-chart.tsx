"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { getProfitTrend } from "@/actions/transaction/actions";
import { getTrendScale } from "@/lib/profit-trend";
import { cn, convertToIDR, convertToSignedIDR } from "@/lib/utils";

type ProfitTrend = Awaited<ReturnType<typeof getProfitTrend>>;

const AXIS_NUMBER_FORMAT = { notation: "compact" } as const;

function GridLine({ percent }: { percent: number }) {
  return (
    <div
      aria-hidden
      className="absolute inset-x-0 h-px bg-border"
      style={{ bottom: `${percent}%` }}
    />
  );
}

function AxisLabel({ percent, text }: { percent: number; text: string }) {
  return (
    <span
      className="absolute right-0 text-xs translate-y-1/2 text-muted-foreground tabular-nums whitespace-nowrap"
      style={{ bottom: `${percent}%` }}
    >
      {text}
    </span>
  );
}

// One column of the plot, grown from the shared baseline: up for a profit, down for a loss.
function Bar({
  value,
  baselinePercent,
  heightPercent,
  className,
}: {
  value: number;
  baselinePercent: number;
  heightPercent: number;
  className: string;
}) {
  const isLoss = value < 0;

  return (
    <div
      aria-hidden
      className={cn(
        "absolute left-1/2 w-full max-w-6 -translate-x-1/2",
        isLoss ? "rounded-b" : "rounded-t",
        className,
      )}
      style={{
        height: `${heightPercent}%`,
        ...(isLoss
          ? { top: `${100 - baselinePercent}%` }
          : { bottom: `${baselinePercent}%` }),
      }}
    />
  );
}

// Direction is carried by position, not by a green/red pair, which fails for colour-blind readers. Hovering,
// tapping or focusing a month fills the readout below, so every figure is reachable on a phone and by keyboard.
export function ProfitTrendChart({ months, projection }: ProfitTrend) {
  const t = useTranslations("dashboard.trend");
  const format = useFormatter();
  const lastIndex = months.length - 1;
  const [selectedIndex, setSelectedIndex] = useState(lastIndex);

  const projectedProfit =
    projection.status === "ready" ? projection.profit : null;
  const scale = getTrendScale([
    ...months.map(({ profit }) => profit),
    projectedProfit ?? 0,
  ]);
  const selected = months[selectedIndex];

  return (
    <div className="space-y-4">
      <div role="group" aria-label={t("chartLabel")} className="flex gap-2">
        <div aria-hidden className="relative w-12 h-40 shrink-0">
          <AxisLabel
            percent={100}
            text={format.number(scale.top, AXIS_NUMBER_FORMAT)}
          />
          <AxisLabel percent={scale.baselinePercent} text="0" />
          {scale.bottom > 0 && (
            <AxisLabel
              percent={0}
              text={`−${format.number(scale.bottom, AXIS_NUMBER_FORMAT)}`}
            />
          )}
        </div>
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-x-0 top-0 h-40">
            <GridLine percent={100} />
            {scale.bottom > 0 && <GridLine percent={0} />}
            <GridLine percent={scale.baselinePercent} />
          </div>
          <ul className="relative grid grid-cols-6 gap-0.5">
            {months.map((month, index) => {
              const monthName = format.dateTime(
                new Date(month.startDate),
                "monthName",
              );

              return (
                <li key={month.startDate}>
                  <button
                    type="button"
                    aria-pressed={index === selectedIndex}
                    aria-label={
                      month.hasRecords
                        ? t("barLabel", {
                            month: monthName,
                            amount: convertToSignedIDR(month.profit),
                          })
                        : t("barLabelEmpty", { month: monthName })
                    }
                    onClick={() => setSelectedIndex(index)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onFocus={() => setSelectedIndex(index)}
                    className="flex flex-col w-full rounded-md outline-none cursor-pointer transition-colors hover:bg-foreground/5 aria-pressed:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span className="relative block w-full h-40">
                      {index === lastIndex && projectedProfit !== null && (
                        <Bar
                          value={projectedProfit}
                          baselinePercent={scale.baselinePercent}
                          heightPercent={scale.heightPercent(projectedProfit)}
                          className="bg-chart-1/20"
                        />
                      )}
                      <Bar
                        value={month.profit}
                        baselinePercent={scale.baselinePercent}
                        heightPercent={scale.heightPercent(month.profit)}
                        className="bg-chart-1"
                      />
                    </span>
                    <span
                      className={cn(
                        "block py-1.5 text-xs text-center text-muted-foreground",
                        index === selectedIndex &&
                          "font-medium text-foreground",
                      )}
                    >
                      {format.dateTime(new Date(month.startDate), "monthShort")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {projectedProfit !== null && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden className="rounded-sm size-3 bg-chart-1/20" />
          {t("projectionKey")}
        </p>
      )}

      <div aria-live="polite" className="pt-4 border-t space-y-3">
        <p className="text-sm font-medium">
          {format.dateTime(new Date(selected.startDate), "monthName")}
          {selectedIndex === lastIndex && (
            <span className="font-normal text-muted-foreground">
              {" · "}
              {t("soFar")}
            </span>
          )}
        </p>
        {selected.hasRecords ? (
          <dl className="grid gap-3 text-base sm:grid-cols-3">
            <div className="flex items-baseline justify-between gap-4 sm:block">
              <dt className="text-sm text-muted-foreground">{t("income")}</dt>
              <dd className="font-medium tabular-nums">
                {convertToIDR(selected.businessIncome)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 sm:block">
              <dt className="text-sm text-muted-foreground">{t("expense")}</dt>
              <dd className="font-medium tabular-nums">
                {convertToIDR(selected.businessExpense)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 sm:block">
              <dt className="text-sm text-muted-foreground">{t("profit")}</dt>
              <dd className="font-semibold tabular-nums">
                {convertToSignedIDR(selected.profit)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noRecords")}</p>
        )}
      </div>
    </div>
  );
}
