import "server-only";

import {
  DateRange,
  getMonthRanges,
  getPreviousMonthToDate,
  getTodayInJakarta,
} from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { summarizeTransactions } from "@/lib/transaction-summary";
import { TransactionPayload } from "@/validations/transaction-validations";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// What the user sees after logging: a one-line insight (Phase 1 / 1.11).
// Every figure comes from SQL totals; the client only formats them into a sentence.

export type LoggingInsight = {
  category: string;
  spent: number;
  previousSpent: number;
  difference: number;
};

// Only expenses dated this month change a month-to-date total; income and backdated entries get no insight.
export function sumAddedThisMonth(
  saved: TransactionPayload[],
  { startDate, endDate }: DateRange,
): Map<string, number> {
  const added = new Map<string, number>();

  for (const { type, category, amount, date } of saved) {
    if (type !== "expense" || date < startDate || date > endDate) continue;
    added.set(category, (added.get(category) ?? 0) + amount);
  }

  return added;
}

export function buildLoggingInsight({
  added,
  spentThisMonth,
  spentLastMonthToDate,
}: {
  added: Map<string, number>;
  spentThisMonth: Map<string, number>;
  spentLastMonthToDate: Map<string, number>;
}): LoggingInsight {
  // One line only: about the category that received the most money in this save.
  const [category] = [...added].reduce((top, entry) =>
    entry[1] > top[1] ? entry : top,
  );
  const spent = spentThisMonth.get(category) ?? 0;
  const previousSpent = spentLastMonthToDate.get(category) ?? 0;

  return {
    category,
    spent,
    previousSpent,
    difference: spent - previousSpent,
  };
}

// Expense totals per category for the range, summed in SQL.
async function loadExpenseByCategory(
  supabase: SupabaseClient,
  { startDate, endDate }: DateRange,
): Promise<Map<string, number>> {
  const { categories } = await summarizeTransactions(
    supabase,
    startDate,
    endDate,
  );

  return new Map(
    categories
      .filter((row) => row.type === "expense")
      .map((row) => [row.category, row.total]),
  );
}

// Called after the transactions are stored.
export async function loadLoggingInsight(
  supabase: SupabaseClient,
  saved: TransactionPayload[],
): Promise<LoggingInsight | null> {
  const today = getTodayInJakarta();
  const { current } = getMonthRanges(today);
  const added = sumAddedThisMonth(saved, current);
  if (added.size === 0) return null;

  const [spentThisMonth, spentLastMonthToDate] = await Promise.all([
    loadExpenseByCategory(supabase, current),
    loadExpenseByCategory(supabase, getPreviousMonthToDate(today)),
  ]);

  return buildLoggingInsight({ added, spentThisMonth, spentLastMonthToDate });
}
