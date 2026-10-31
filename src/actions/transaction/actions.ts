"use server";

import { captureEvent } from "@/lib/analytics";
import { requireUserId } from "@/lib/auth";
import { LoggingInsight, loadLoggingInsight } from "@/lib/logging-feedback";
import { DateRange, getMonthRanges, getTodayInJakarta } from "@/lib/dates";
import { summarizeTransactions } from "@/lib/transaction-summary";
import { generateEmbedding, toEmbeddingText } from "@/lib/embedding";
import { createClient } from "@/lib/supabase/server";
import { Transaction } from "@/types/transaction";
import {
  TransactionPayload,
  transactionIdSchema,
  transactionPayloadSchema,
  TransactionSource,
  transactionSourceSchema,
} from "@/validations/transaction-validations";
import { MAX_TRANSACTIONS_PER_MESSAGE } from "@/validations/wizard-validations";
import z from "zod";

const reviewedDraftsSchema = z
  .array(
    z.object({
      payload: transactionPayloadSchema,
      editedInPreview: z.boolean(),
    }),
  )
  .min(1)
  // The review card holds the drafts of one message at a time.
  .max(MAX_TRANSACTIONS_PER_MESSAGE);

// The transactions are already stored, so a failure here must not turn the save into an error; it only drops the insight.
async function loadInsightAfterSave(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  saved: TransactionPayload[],
): Promise<LoggingInsight | null> {
  try {
    const insight = await loadLoggingInsight(supabase, saved);
    if (insight) captureEvent(userId, "logging_insight_shown", {});
    return insight;
  } catch (error) {
    console.error("[transaction] failed to load logging insight", error);
    return null;
  }
}

// Wide enough for any stored date (future-dated entries included), so the RPC covers every transaction.
const ALL_TIME_START = "0001-01-01";
const ALL_TIME_END = "9999-12-31";

// Summed in SQL: selecting every row was capped by PostgREST's row limit and undercounted after ~1,000 rows.
export async function getBalanceSummary() {
  const supabase = await createClient();
  const { totalIncome, totalExpense, net } = await summarizeTransactions(
    supabase,
    ALL_TIME_START,
    ALL_TIME_END,
  );

  return {
    totalIncome,
    totalExpense,
    savings: net,
  };
}

// One action for every "this month" card, so they share a single query instead of each calling the RPC.
export async function getMonthlySummary() {
  const ranges = getMonthRanges(getTodayInJakarta());

  const supabase = await createClient();
  const [current, previous] = await Promise.all([
    summarizeTransactions(
      supabase,
      ranges.current.startDate,
      ranges.current.endDate,
    ),
    summarizeTransactions(
      supabase,
      ranges.previous.startDate,
      ranges.previous.endDate,
    ),
  ]);

  const toPeriod = (
    { startDate, endDate }: DateRange,
    summary: typeof current,
  ) => ({
    startDate,
    endDate,
    income: summary.totalIncome,
    expense: summary.totalExpense,
    saved: summary.net,
    savingsRatePercent: summary.savingsRatePercent,
  });

  return {
    current: toPeriod(ranges.current, current),
    previous: toPeriod(ranges.previous, previous),
    spendingByCategory: current.categories
      .filter((row) => row.type === "expense")
      .map(({ category, total }) => ({ category, total }))
      .sort((a, b) => b.total - a.total),
  };
}

export async function getTransactions(params?: {
  limit?: number;
  page?: number;
  search?: string;
}) {
  const { limit = 10, page = 1, search } = params || {};
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("id, amount, type, description, date, category", {
      count: "exact",
    });

  if (search) {
    query = query.ilike("description", `%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw new Error(error.message);

  const totalData = count ?? 0;

  return {
    data,
    totalData,
    totalPages: Math.ceil(totalData / limit),
  };
}

// Payloads are parsed before the embedding call, so malformed input never spends Gemini tokens.
export async function createTransaction(
  payload: TransactionPayload,
  source: TransactionSource,
) {
  // Server actions are public endpoints; RLS would reject the insert, but only after the embedding was paid for.
  const userId = await requireUserId();
  const transaction = transactionPayloadSchema.parse(payload);
  const transactionSource = transactionSourceSchema.parse(source);
  const embedding = await generateEmbedding(toEmbeddingText(transaction));
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({ ...transaction, embedding })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  captureEvent(userId, "transaction_created", {
    source: transactionSource,
    transaction_id: data.id,
  });

  return {
    ...data,
    insight: await loadInsightAfterSave(supabase, userId, [transaction]),
  };
}

// Saves the quick entry drafts the user reviewed (Phase 1 / 1.1) in one insert, so either all of them are stored or none.
export async function createTransactions(
  drafts: { payload: TransactionPayload; editedInPreview: boolean }[],
) {
  const userId = await requireUserId();
  const parsed = reviewedDraftsSchema.parse(drafts);
  const embeddings = await Promise.all(
    parsed.map(({ payload }) => generateEmbedding(toEmbeddingText(payload))),
  );
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert(
      parsed.map(({ payload }, index) => ({
        ...payload,
        embedding: embeddings[index],
      })),
    )
    .select("id");

  if (error) throw new Error(error.message);

  // PostgREST returns inserted rows in the order they were sent.
  data.forEach(({ id }, index) => {
    captureEvent(userId, "transaction_created", {
      source: "wizard",
      transaction_id: id,
      edited_in_preview: parsed[index].editedInPreview,
    });
  });

  return {
    transactions: data,
    insight: await loadInsightAfterSave(
      supabase,
      userId,
      parsed.map(({ payload }) => payload),
    ),
  };
}

export async function updateTransaction(
  id: Transaction["id"],
  payload: TransactionPayload,
  source: TransactionSource,
) {
  const userId = await requireUserId();
  const transactionId = transactionIdSchema.parse(id);
  const transaction = transactionPayloadSchema.parse(payload);
  const transactionSource = transactionSourceSchema.parse(source);
  // The edited fields change what the row means, so a stale vector would mislead search.
  const embedding = await generateEmbedding(toEmbeddingText(transaction));
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .update({ ...transaction, embedding })
    .eq("id", transactionId)
    .select("id");

  if (error) throw new Error(error.message);
  // An update that matches no row is not an error in Supabase, so surface it explicitly.
  if (data.length === 0) throw new Error("Transaction not found");

  captureEvent(userId, "transaction_edited", {
    source: transactionSource,
    transaction_id: transactionId,
  });

  return data;
}

export async function deleteTransaction(id: Transaction["id"]) {
  const transactionId = transactionIdSchema.parse(id);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .select("id");

  if (error) throw new Error(error.message);
  // A delete that matches no row is not an error in Supabase, so surface it explicitly.
  if (data.length === 0) throw new Error("Transaction not found");

  return data;
}
