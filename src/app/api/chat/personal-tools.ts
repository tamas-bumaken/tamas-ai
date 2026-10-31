import "server-only";

import {
  getCategoryGroup,
  TRANSACTION_CATEGORIES,
} from "@/constans/transaction-categories";
import { generateEmbedding } from "@/lib/embedding";
import { createClient } from "@/lib/supabase/server";
import { percentOf, summarizeTransactions } from "@/lib/transaction-summary";
import {
  FunctionCall,
  FunctionDeclaration,
  FunctionResponse,
} from "@google/genai";
import z from "zod";
import { change, dailyAverage, elapsedDays } from "./derived-figures";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// What every tool needs besides its arguments. The supabase client must carry the user's session:
// RLS is what limits every query to their own rows.
export type PersonalToolContext = {
  supabase: SupabaseClient;
  // Today in Jakarta, so averages only count days that have passed.
  today: string;
};

// The model sees each match's similarity, so a loose threshold lets it judge borderline rows instead of getting nothing.
const SEARCH_MATCH_THRESHOLD = 0.4;
const SEARCH_MATCH_COUNT = 10;

// Sent to Gemini through z.toJSONSchema, so the .describe() texts double as model guidance.
const summaryArgsSchema = z
  .object({
    start_date: z.iso.date().describe("First day of the range, YYYY-MM-DD."),
    end_date: z.iso.date().describe("Last day of the range, YYYY-MM-DD."),
    compare_start_date: z.iso
      .date()
      .optional()
      .describe(
        "First day of a period to compare with, e.g. the previous month. Pass it with compare_end_date to get the differences and percentage changes computed for you.",
      ),
    compare_end_date: z.iso
      .date()
      .optional()
      .describe("Last day of the comparison period, YYYY-MM-DD."),
  })
  .refine(({ start_date, end_date }) => start_date <= end_date, {
    message: "start_date must not be after end_date",
  })
  .refine(
    ({ compare_start_date, compare_end_date }) =>
      (compare_start_date === undefined) === (compare_end_date === undefined),
    {
      message: "Pass both compare_start_date and compare_end_date, or neither",
    },
  )
  .refine(
    ({ compare_start_date, compare_end_date }) =>
      !compare_start_date ||
      !compare_end_date ||
      compare_start_date <= compare_end_date,
    { message: "compare_start_date must not be after compare_end_date" },
  );

const searchArgsSchema = z.object({
  query: z.string().trim().min(1).max(200),
});

const keywordListSchema = z.array(z.string().trim().min(2).max(50)).max(8);

// Sent to Gemini through z.toJSONSchema, so the .describe() texts double as model guidance.
const filteredTotalArgsSchema = z
  .object({
    start_date: z.iso.date().describe("First day of the range, YYYY-MM-DD."),
    end_date: z.iso.date().describe("Last day of the range, YYYY-MM-DD."),
    keywords: keywordListSchema
      .min(1)
      .optional()
      .describe(
        'Words to look for in the transaction description, case-insensitive; a transaction counts when any of them appears. Descriptions can be in Indonesian or English, so include both, e.g. ["ayam", "chicken"].',
      ),
    exclude_keywords: keywordListSchema
      .optional()
      .describe(
        'Words that rule a transaction out, e.g. ["kopiah"] when counting "kopi".',
      ),
    category: z
      .enum(TRANSACTION_CATEGORIES)
      .optional()
      .describe("Only transactions in this category."),
    type: z
      .enum(["income", "expense"])
      .optional()
      .describe("Only income or only expense transactions."),
  })
  .refine(({ start_date, end_date }) => start_date <= end_date, {
    message: "start_date must not be after end_date",
  })
  .refine(({ keywords, category }) => keywords || category, {
    message:
      "Pass keywords or a category; for totals without a filter use get_business_summary",
  });

const aggregateResultSchema = z.object({
  totals: z.array(
    z.object({
      type: z.enum(["income", "expense"]),
      total: z.coerce.number(),
      transaction_count: z.coerce.number(),
    }),
  ),
  largest_matches: z.array(
    z.object({
      type: z.enum(["income", "expense"]),
      category: z.string(),
      amount: z.coerce.number(),
      description: z.string().nullable(),
      date: z.string(),
    }),
  ),
});

const matchRowSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string(),
  amount: z.coerce.number(),
  description: z.string().nullable(),
  date: z.string(),
  similarity: z.number(),
});

export const PERSONAL_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "get_business_summary",
    description:
      "Returns the business's figures for a date range (inclusive): business income, business costs, profit and profit margin; what the owner took out (personal withdrawals and ceremony or adat costs) and its share of the profit; capital put in, loan payments, and the cash left. Also returns totals per category with each category's group, its share of its type's total, its share of business income, and daily averages over the days that have passed. To compare two periods, call it once with compare_start_date and compare_end_date: the differences and percentage changes are computed for you.",
    parametersJsonSchema: z.toJSONSchema(summaryArgsSchema),
  },
  {
    name: "get_filtered_total",
    description:
      'Returns the exact total and number of the user\'s transactions whose description contains given keywords and/or that are in a category, for a date range (inclusive), split into income and expense, plus the 5 largest matches. Use it whenever the user asks how much they spent or received on a specific item, supplier or purpose, e.g. "total beli ayam bulan ini" or "berapa habis buat bensin minggu ini". If largest_matches contains unrelated transactions, call it again with exclude_keywords.',
    parametersJsonSchema: z.toJSONSchema(filteredTotalArgsSchema),
  },
  {
    name: "search_transactions",
    description:
      "Finds the user's individual transactions that are semantically closest to a query, such as a merchant, item, or purpose. Returns at most 10 matches with a similarity score; it is not a complete list, so never sum its results.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            'What the transactions were for, e.g. "ayam", "sewa kios", "gaji karyawan".',
        },
      },
      required: ["query"],
    },
  },
];

type Summary = Awaited<ReturnType<typeof summarizeTransactions>>;

function categories(
  { categories: rows, businessIncome }: Summary,
  totalIncome: number,
  totalExpense: number,
  days: number,
) {
  return rows.map((row) => ({
    ...row,
    group: getCategoryGroup(row.category),
    // Share of the total for the row's own type, so expense categories add up to 100.
    percent_of_type_total: percentOf(
      row.total,
      row.type === "income" ? totalIncome : totalExpense,
    ),
    daily_average: dailyAverage(row.total, days),
    percent_of_business_income:
      row.type === "expense" ? percentOf(row.total, businessIncome) : null,
  }));
}

// Totals, percentages and averages are computed here because models are unreliable at arithmetic,
// and the advice they give leans on exactly these numbers (Phase 1 / 1.13).
function describePeriod(
  summary: Summary,
  startDate: string,
  endDate: string,
  context: PersonalToolContext,
) {
  const { totalIncome, totalExpense, businessIncome, businessExpense } =
    summary;
  const days = elapsedDays(startDate, endDate, context.today);

  return {
    start_date: startDate,
    end_date: endDate,
    days_counted: days,
    business_income: businessIncome,
    business_expense: businessExpense,
    profit: summary.profit,
    profit_margin_percent: summary.profitMarginPercent,
    daily_average_business_income: dailyAverage(businessIncome, days),
    daily_average_business_expense: dailyAverage(businessExpense, days),
    owner_withdrawals: summary.ownerWithdrawals,
    ceremony: summary.ceremony,
    owner_taken: summary.ownerTaken,
    // Null when the business made no profit, where a share of it means nothing.
    owner_taken_percent_of_profit: percentOf(
      summary.ownerTaken,
      summary.profit,
    ),
    owner_capital: summary.ownerCapital,
    loan_installments: summary.loanInstallments,
    cash_in: totalIncome,
    cash_out: totalExpense,
    cash_left: summary.net,
    categories: categories(summary, totalIncome, totalExpense, days),
  };
}

// One change per category that appears in either period, so a category that dropped to zero still shows up.
function compareCategories(current: Summary, previous: Summary) {
  const key = (row: { type: string; category: string }) =>
    `${row.type}:${row.category}`;
  const previousByKey = new Map(
    previous.categories.map((row) => [key(row), row]),
  );
  const currentKeys = new Set(current.categories.map(key));

  return [
    ...current.categories.map((row) => ({
      type: row.type,
      category: row.category,
      total: row.total,
      previous_total: previousByKey.get(key(row))?.total ?? 0,
    })),
    ...previous.categories
      .filter((row) => !currentKeys.has(key(row)))
      .map((row) => ({
        type: row.type,
        category: row.category,
        total: 0,
        previous_total: row.total,
      })),
  ].map((row) => ({ ...row, ...change(row.total, row.previous_total) }));
}

async function getBusinessSummary(
  {
    start_date,
    end_date,
    compare_start_date,
    compare_end_date,
  }: z.infer<typeof summaryArgsSchema>,
  context: PersonalToolContext,
) {
  const [current, previous] = await Promise.all([
    summarizeTransactions(context.supabase, start_date, end_date),
    compare_start_date && compare_end_date
      ? summarizeTransactions(
          context.supabase,
          compare_start_date,
          compare_end_date,
        )
      : null,
  ]);
  const period = describePeriod(current, start_date, end_date, context);

  if (!previous || !compare_start_date || !compare_end_date) return period;

  return {
    ...period,
    comparison: {
      start_date: compare_start_date,
      end_date: compare_end_date,
      business_income: previous.businessIncome,
      business_expense: previous.businessExpense,
      profit: previous.profit,
      owner_taken: previous.ownerTaken,
      cash_left: previous.net,
      changes: {
        business_income: change(
          current.businessIncome,
          previous.businessIncome,
        ),
        business_expense: change(
          current.businessExpense,
          previous.businessExpense,
        ),
        profit: change(current.profit, previous.profit),
        owner_taken: change(current.ownerTaken, previous.ownerTaken),
        cash_left: change(current.net, previous.net),
        categories: compareCategories(current, previous),
      },
    },
  };
}

// Summed by the aggregate_transactions RPC, so the total covers every matching row, not just a page of them.
async function getFilteredTotal(
  args: z.infer<typeof filteredTotalArgsSchema>,
  context: PersonalToolContext,
) {
  const { data, error } = await context.supabase.rpc("aggregate_transactions", {
    start_date: args.start_date,
    end_date: args.end_date,
    keywords: args.keywords ?? null,
    category_filter: args.category ?? null,
    type_filter: args.type ?? null,
    exclude_keywords: args.exclude_keywords ?? null,
  });
  if (error) throw new Error(error.message);

  const { totals, largest_matches } = aggregateResultSchema.parse(data);
  const days = elapsedDays(args.start_date, args.end_date, context.today);

  return {
    ...args,
    days_counted: days,
    totals: totals.map((row) => ({
      ...row,
      daily_average: dailyAverage(row.total, days),
    })),
    largest_matches,
  };
}

async function searchTransactions(
  { query }: z.infer<typeof searchArgsSchema>,
  supabase: SupabaseClient,
) {
  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc("match_transactions", {
    query_embedding: queryEmbedding,
    match_threshold: SEARCH_MATCH_THRESHOLD,
    match_count: SEARCH_MATCH_COUNT,
  });
  if (error) throw new Error(error.message);

  // Ids and user_id are dropped: the model has no use for them and they would only cost tokens.
  const transactions = z
    .array(matchRowSchema)
    .parse(data)
    .map((row) => ({ ...row, similarity: Number(row.similarity.toFixed(3)) }));

  return { query, transactions };
}

// Failures go back to the model as an "error" response so it tells the user instead of inventing numbers.
export async function runPersonalTool(
  call: FunctionCall,
  context: PersonalToolContext,
): Promise<FunctionResponse> {
  const respond = (response: Record<string, unknown>): FunctionResponse => ({
    id: call.id,
    name: call.name,
    response,
  });

  // The model can fix its own arguments, so it gets the validation details; other failures stay generic.
  const invalidArgs = (error: z.ZodError) =>
    respond({ error: `Invalid arguments: ${z.prettifyError(error)}` });

  try {
    switch (call.name) {
      case "get_business_summary": {
        const args = summaryArgsSchema.safeParse(call.args);
        if (!args.success) return invalidArgs(args.error);

        return respond({
          output: await getBusinessSummary(args.data, context),
        });
      }
      case "get_filtered_total": {
        const args = filteredTotalArgsSchema.safeParse(call.args);
        if (!args.success) return invalidArgs(args.error);

        return respond({
          output: await getFilteredTotal(args.data, context),
        });
      }
      case "search_transactions": {
        const args = searchArgsSchema.safeParse(call.args);
        if (!args.success) return invalidArgs(args.error);

        return respond({
          output: await searchTransactions(args.data, context.supabase),
        });
      }
      default:
        return respond({ error: `Unknown tool: ${call.name}` });
    }
  } catch (error) {
    console.error(`[api/chat] tool ${call.name} failed`, error);
    return respond({ error: "Failed to load the user's transactions." });
  }
}
