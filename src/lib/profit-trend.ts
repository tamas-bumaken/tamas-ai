// Shared by the server action and the dashboard, so it stays free of server-only imports.

// Before a full week has passed, one large purchase would swing the daily pace too far to be useful.
const MIN_DAYS_FOR_PROJECTION = 7;
const PROJECTION_ROUNDING = 1000;
// A few percent either way is noise in an estimate this rough.
const SIMILAR_SHARE = 0.05;

export type ReadyProjection = {
  status: "ready";
  profit: number;
  ownerTaken: number;
};

export type MonthEndProjection =
  | ReadyProjection
  | { status: "too_early" }
  | { status: "month_end" }
  | { status: "no_sales" };

// Straight-line estimate from this month's daily pace. Figures come from SQL totals and the arithmetic stays here,
// so neither the UI nor a model ever computes it.
export function projectMonthEnd(
  current: { businessIncome: number; profit: number; ownerTaken: number },
  today: string,
): MonthEndProjection {
  const [year, month, day] = today.split("-").map(Number);
  // Day 0 of the next month is this month's last day; months in Date.UTC are zero-based.
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  if (day < MIN_DAYS_FOR_PROJECTION) return { status: "too_early" };
  if (day === daysInMonth) return { status: "month_end" };
  if (current.businessIncome === 0) return { status: "no_sales" };

  const estimate = (value: number) =>
    Math.round((value * daysInMonth) / day / PROJECTION_ROUNDING) *
    PROJECTION_ROUNDING;

  return {
    status: "ready",
    profit: estimate(current.profit),
    ownerTaken: estimate(current.ownerTaken),
  };
}

// Picks the sentence for the "if this continues" note. Returns a key of "dashboard.trend.insights".
export function getProjectionInsight(
  projection: { profit: number; ownerTaken: number },
  previous: { profit: number; hasRecords: boolean },
) {
  const key = (() => {
    if (projection.profit < 0) return "loss";
    if (!previous.hasRecords) return "noPrevious";

    const difference = projection.profit - previous.profit;
    if (Math.abs(difference) <= Math.abs(previous.profit) * SIMILAR_SHARE) {
      return "similar";
    }
    return difference > 0 ? "higher" : "lower";
  })();

  return {
    key,
    // A loss already says the month is in trouble; comparing what was taken with a negative profit adds nothing.
    takenMoreThanProfit:
      key !== "loss" && projection.ownerTaken > projection.profit,
  } as const;
}

// Rounds up to 1, 2 or 5 times a power of ten, so the axis shows clean figures.
export function niceCeil(value: number): number {
  if (value <= 0) return 0;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find(
    (candidate) => value <= candidate * magnitude,
  );

  return (step ?? 10) * magnitude;
}

// One scale for gains and losses: a loss of the same size draws a bar of the same length, below the baseline.
export function getTrendScale(values: number[]) {
  const top = niceCeil(Math.max(0, ...values));
  const bottom = niceCeil(Math.max(0, ...values.map((value) => -value)));
  const span = top + bottom || 1;

  return {
    top,
    bottom,
    baselinePercent: (bottom / span) * 100,
    heightPercent: (value: number) => (Math.abs(value) / span) * 100,
  };
}
