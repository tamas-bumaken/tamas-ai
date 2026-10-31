import { describe, expect, it, vi } from "vitest";
import { percentOf, summarizeTransactions } from "./transaction-summary";

type SupabaseClient = Parameters<typeof summarizeTransactions>[0];

// Only rpc() is used, so the fake implements just that; the cast keeps the real client type in the signature.
function fakeClient(result: {
  data: unknown;
  error: { message: string } | null;
}) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { client: { rpc } as unknown as SupabaseClient, rpc };
}

describe("percentOf", () => {
  it("returns the share as a percentage", () => {
    expect(percentOf(25, 100)).toBe(25);
    expect(percentOf(1_500_000, 6_000_000)).toBe(25);
  });

  it("truncates to one decimal instead of rounding, so 99.97% never reads as 100%", () => {
    expect(percentOf(9_997, 10_000)).toBe(99.9);
    expect(percentOf(2, 3)).toBe(66.6);
  });

  it("truncates negative shares toward zero", () => {
    expect(percentOf(-1, 3)).toBe(-33.3);
  });

  it("returns null when there is nothing to divide by", () => {
    expect(percentOf(500, 0)).toBeNull();
    expect(percentOf(500, -100)).toBeNull();
  });
});

describe("summarizeTransactions", () => {
  it("adds up income and expense from the per-category rows of the RPC", async () => {
    const { client, rpc } = fakeClient({
      data: [
        {
          type: "income",
          category: "Salary",
          total: 6_000_000,
          transaction_count: 1,
        },
        {
          type: "income",
          category: "Side Income",
          total: 500_000,
          transaction_count: 2,
        },
        {
          type: "expense",
          category: "Food",
          total: 1_500_000,
          transaction_count: 40,
        },
        {
          type: "expense",
          category: "Housing",
          total: 1_200_000,
          transaction_count: 1,
        },
      ],
      error: null,
    });

    const summary = await summarizeTransactions(
      client,
      "2026-10-01",
      "2026-10-22",
    );

    expect(rpc).toHaveBeenCalledWith("summarize_transactions", {
      start_date: "2026-10-01",
      end_date: "2026-10-22",
    });
    expect(summary).toMatchObject({
      totalIncome: 6_500_000,
      totalExpense: 2_700_000,
      net: 3_800_000,
      savingsRatePercent: 58.4,
    });
    expect(summary.categories).toHaveLength(4);
  });

  it("accepts numeric and bigint columns that arrive as strings", async () => {
    const { client } = fakeClient({
      data: [
        {
          type: "income",
          category: "Salary",
          total: "7000000",
          transaction_count: "1",
        },
        {
          type: "expense",
          category: "Food",
          total: "1750000.50",
          transaction_count: "12",
        },
      ],
      error: null,
    });

    const summary = await summarizeTransactions(
      client,
      "2026-10-01",
      "2026-10-31",
    );

    expect(summary.totalIncome).toBe(7_000_000);
    expect(summary.totalExpense).toBe(1_750_000.5);
    expect(summary.categories[1].transaction_count).toBe(12);
  });

  it("returns zeros and no savings rate for a period without transactions", async () => {
    const { client } = fakeClient({ data: [], error: null });

    expect(
      await summarizeTransactions(client, "2026-10-01", "2026-10-31"),
    ).toEqual({
      totalIncome: 0,
      totalExpense: 0,
      net: 0,
      savingsRatePercent: null,
      categories: [],
    });
  });

  it("reports a negative net and savings rate when spending exceeds income", async () => {
    const { client } = fakeClient({
      data: [
        {
          type: "income",
          category: "Salary",
          total: 5_000_000,
          transaction_count: 1,
        },
        {
          type: "expense",
          category: "Installments",
          total: 6_000_000,
          transaction_count: 3,
        },
      ],
      error: null,
    });

    const summary = await summarizeTransactions(
      client,
      "2026-10-01",
      "2026-10-31",
    );

    expect(summary.net).toBe(-1_000_000);
    expect(summary.savingsRatePercent).toBe(-20);
  });

  it("has no savings rate when only expenses were recorded", async () => {
    const { client } = fakeClient({
      data: [
        {
          type: "expense",
          category: "Food",
          total: 250_000,
          transaction_count: 5,
        },
      ],
      error: null,
    });

    const summary = await summarizeTransactions(
      client,
      "2026-10-01",
      "2026-10-31",
    );

    expect(summary.net).toBe(-250_000);
    expect(summary.savingsRatePercent).toBeNull();
  });

  it("throws when the RPC fails instead of reporting zero", async () => {
    const { client } = fakeClient({
      data: null,
      error: { message: "permission denied" },
    });

    await expect(
      summarizeTransactions(client, "2026-10-01", "2026-10-31"),
    ).rejects.toThrow("permission denied");
  });

  it("rejects rows with an unknown transaction type", async () => {
    const { client } = fakeClient({
      data: [
        {
          type: "transfer",
          category: "Others",
          total: 100,
          transaction_count: 1,
        },
      ],
      error: null,
    });

    await expect(
      summarizeTransactions(client, "2026-10-01", "2026-10-31"),
    ).rejects.toThrow();
  });
});
