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

function row(
  type: "income" | "expense",
  category: string,
  total: number | string,
  transaction_count: number | string = 1,
) {
  return { type, category, total, transaction_count };
}

async function summarize(rows: ReturnType<typeof row>[]) {
  const { client } = fakeClient({ data: rows, error: null });

  return summarizeTransactions(client, "2026-10-01", "2026-10-31");
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
  it("calls the RPC with the range", async () => {
    const { client, rpc } = fakeClient({ data: [], error: null });

    await summarizeTransactions(client, "2026-10-01", "2026-10-22");

    expect(rpc).toHaveBeenCalledWith("summarize_transactions", {
      start_date: "2026-10-01",
      end_date: "2026-10-22",
    });
  });

  const MONTH = [
    row("income", "Sales", 800_000),
    row("income", "Other Business Income", 50_000),
    row("income", "Owner Capital", 500_000),
    row("expense", "Raw Materials", 400_000),
    row("expense", "Loan Installments", 200_000),
    row("expense", "Owner Withdrawal", 100_000),
    row("expense", "Ceremony & Adat", 150_000),
  ];

  it("counts only business income and business costs toward profit", async () => {
    expect(await summarize(MONTH)).toMatchObject({
      businessIncome: 850_000,
      businessExpense: 400_000,
      profit: 450_000,
      profitMarginPercent: 52.9,
    });
  });

  it("keeps what the owner takes apart from business costs", async () => {
    expect(await summarize(MONTH)).toMatchObject({
      ownerWithdrawals: 100_000,
      ceremony: 150_000,
      ownerTaken: 250_000,
    });
  });

  it("reports capital and loan payments separately from profit", async () => {
    expect(await summarize(MONTH)).toMatchObject({
      ownerCapital: 500_000,
      loanInstallments: 200_000,
    });
  });

  it("counts every movement in the cash left", async () => {
    expect(await summarize(MONTH)).toMatchObject({
      totalIncome: 1_350_000,
      totalExpense: 850_000,
      net: 500_000,
    });
  });

  it("reconciles profit with cash, so the dashboard's figures always add up", async () => {
    const summary = await summarize(MONTH);

    expect(
      summary.profit +
        summary.ownerCapital -
        summary.loanInstallments -
        summary.ownerTaken,
    ).toBe(summary.net);
  });

  it("accepts numeric and bigint columns that arrive as strings", async () => {
    const summary = await summarize([
      row("income", "Sales", "7000000", "1"),
      row("expense", "Raw Materials", "1750000.50", "12"),
    ]);

    expect(summary.businessIncome).toBe(7_000_000);
    expect(summary.businessExpense).toBe(1_750_000.5);
    expect(summary.categories[1].transaction_count).toBe(12);
  });

  it("returns zeros and no margin for a period without transactions", async () => {
    expect(await summarize([])).toEqual({
      totalIncome: 0,
      totalExpense: 0,
      net: 0,
      businessIncome: 0,
      businessExpense: 0,
      profit: 0,
      profitMarginPercent: null,
      ownerCapital: 0,
      loanInstallments: 0,
      ownerWithdrawals: 0,
      ceremony: 0,
      ownerTaken: 0,
      categories: [],
    });
  });

  it("reports a loss and a negative margin when costs exceed sales", async () => {
    const summary = await summarize([
      row("income", "Sales", 500_000),
      row("expense", "Raw Materials", 600_000),
    ]);

    expect(summary.profit).toBe(-100_000);
    expect(summary.profitMarginPercent).toBe(-20);
  });

  it("has no margin when only costs were recorded", async () => {
    const summary = await summarize([row("expense", "Raw Materials", 250_000)]);

    expect(summary.profit).toBe(-250_000);
    expect(summary.profitMarginPercent).toBeNull();
  });

  it("does not treat capital as sales when nothing was sold", async () => {
    const summary = await summarize([
      row("income", "Owner Capital", 1_000_000),
    ]);

    expect(summary.businessIncome).toBe(0);
    expect(summary.profit).toBe(0);
    expect(summary.net).toBe(1_000_000);
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
          category: "Sales",
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
