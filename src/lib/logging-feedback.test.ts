import { describe, expect, it } from "vitest";
import { TransactionPayload } from "@/validations/transaction-validations";
import { buildLoggingInsight, sumAddedThisMonth } from "./logging-feedback";

const OCTOBER = { startDate: "2026-10-01", endDate: "2026-10-23" };

function expense(
  category: TransactionPayload["category"],
  amount: number,
  date = "2026-10-23",
): TransactionPayload {
  return { type: "expense", category, amount, date, description: "" };
}

describe("sumAddedThisMonth", () => {
  it("sums this month's expenses per category and skips income and other months", () => {
    const added = sumAddedThisMonth(
      [
        expense("Food", 25_000),
        expense("Food", 18_000),
        expense("Transportation", 5_000),
        expense("Shopping", 300_000, "2026-09-30"),
        {
          type: "income",
          category: "Salary",
          amount: 10_000_000,
          date: "2026-10-23",
          description: "",
        },
      ],
      OCTOBER,
    );

    expect([...added]).toEqual([
      ["Food", 43_000],
      ["Transportation", 5_000],
    ]);
  });
});

describe("buildLoggingInsight", () => {
  it("compares the category that got the most money with the same point last month", () => {
    const insight = buildLoggingInsight({
      added: new Map([
        ["Transportation", 5_000],
        ["Food", 25_000],
      ]),
      spentThisMonth: new Map([
        ["Food", 320_000],
        ["Transportation", 50_000],
      ]),
      spentLastMonthToDate: new Map([["Food", 400_000]]),
    });

    expect(insight).toEqual({
      category: "Food",
      spent: 320_000,
      previousSpent: 400_000,
      difference: -80_000,
    });
  });

  it("treats a category with no spending last month as zero", () => {
    const insight = buildLoggingInsight({
      added: new Map([["Food", 25_000]]),
      spentThisMonth: new Map([["Food", 25_000]]),
      spentLastMonthToDate: new Map(),
    });

    expect(insight).toEqual({
      category: "Food",
      spent: 25_000,
      previousSpent: 0,
      difference: 25_000,
    });
  });
});
