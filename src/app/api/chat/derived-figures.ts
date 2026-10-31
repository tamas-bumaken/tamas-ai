import { percentOf } from "@/lib/transaction-summary";

// Figures the advisor mentions besides raw totals (Phase 1 / 1.13). They are computed here, never by the model,
// so every percentage or average in an answer is exact and matches the dashboard's rounding.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcTime(isoDate: string): number {
  return Date.parse(`${isoDate}T00:00:00Z`);
}

// Days from start_date up to end_date or today, whichever comes first, both inclusive.
// A month asked for mid-month is averaged over the days that have passed, not the whole month.
export function elapsedDays(
  startDate: string,
  endDate: string,
  today: string,
): number {
  const lastDay = endDate < today ? endDate : today;
  if (lastDay < startDate) return 0;

  return (
    Math.round((toUtcTime(lastDay) - toUtcTime(startDate)) / MS_PER_DAY) + 1
  );
}

// Whole rupiah per day; null when no day of the range has passed yet.
export function dailyAverage(total: number, days: number): number | null {
  return days > 0 ? Math.round(total / days) : null;
}

// Only a range inside one calendar month can be compared with a monthly income.
export function isWithinOneMonth(startDate: string, endDate: string): boolean {
  return startDate.slice(0, 7) === endDate.slice(0, 7);
}

export function percentOfMonthlyIncome(
  total: number,
  monthlyIncome: number | null,
  startDate: string,
  endDate: string,
): number | null {
  if (monthlyIncome === null || !isWithinOneMonth(startDate, endDate)) {
    return null;
  }

  return percentOf(total, monthlyIncome);
}

// Truncated like percentOf; null when the previous value is 0, where a percentage means nothing.
export function change(current: number, previous: number) {
  return {
    difference: current - previous,
    percent_change: percentOf(current - previous, previous),
  };
}
