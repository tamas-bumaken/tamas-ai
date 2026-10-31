import "server-only";

import {
  CategoryGroup,
  CEREMONY_CATEGORY,
  getCategoryGroup,
  OWNER_WITHDRAWAL_CATEGORY,
} from "@/constans/transaction-categories";
import { createClient } from "@/lib/supabase/server";
import z from "zod";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Numeric and bigint columns can arrive as strings depending on their size, so both are coerced.
const summaryRowSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string(),
  total: z.coerce.number(),
  transaction_count: z.coerce.number(),
});

// Truncated to one decimal rather than rounded, so 99.97% never reads as 100% (as if nothing was spent).
export function percentOf(part: number, whole: number): number | null {
  return whole > 0 ? Math.trunc((part / whole) * 1000) / 10 : null;
}

// Summed by the summarize_transactions RPC: a plain select is capped by PostgREST's row limit and would undercount.
// The client must carry the user's session, since RLS is what limits the totals to their own rows.
export async function summarizeTransactions(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
) {
  const { data, error } = await supabase.rpc("summarize_transactions", {
    start_date: startDate,
    end_date: endDate,
  });
  if (error) throw new Error(error.message);

  const categories = z.array(summaryRowSchema).parse(data);
  const sumOf = (type: "income" | "expense") =>
    categories
      .filter((row) => row.type === type)
      .reduce((sum, row) => sum + row.total, 0);

  const sumOfGroup = (group: CategoryGroup) =>
    categories
      .filter((row) => getCategoryGroup(row.category) === group)
      .reduce((sum, row) => sum + row.total, 0);
  const totalOf = (category: string) =>
    categories
      .filter((row) => row.category === category)
      .reduce((sum, row) => sum + row.total, 0);

  const totalIncome = sumOf("income");
  const totalExpense = sumOf("expense");
  const businessIncome = sumOfGroup("business_income");
  const businessExpense = sumOfGroup("business_expense");
  const profit = businessIncome - businessExpense;

  return {
    totalIncome,
    totalExpense,
    // Every rupiah in minus every rupiah out; equals profit + capital - loan payments - what the owner took.
    net: totalIncome - totalExpense,
    businessIncome,
    businessExpense,
    // A simple figure for micro-businesses: materials and equipment count as costs when they are bought.
    profit,
    // Share of business income left after business costs; null when nothing was sold in the range.
    profitMarginPercent: percentOf(profit, businessIncome),
    ownerCapital: sumOfGroup("owner_capital"),
    loanInstallments: sumOfGroup("loan_installments"),
    ownerWithdrawals: totalOf(OWNER_WITHDRAWAL_CATEGORY),
    ceremony: totalOf(CEREMONY_CATEGORY),
    ownerTaken: sumOfGroup("owner_taken"),
    categories,
  };
}
