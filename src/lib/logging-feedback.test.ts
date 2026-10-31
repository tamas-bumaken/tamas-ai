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
        expense("Raw Materials", 25_000),
        expense("Raw Materials", 18_000),
        expense("Transport & Delivery", 5_000),
        expense("Equipment", 300_000, "2026-09-30"),
        {
          type: "income",
          category: "Sales",
          amount: 10_000_000,
          date: "2026-10-23",
          description: "",
        },
      ],
      OCTOBER,
    );

    expect([...added]).toEqual([
      ["Raw Materials", 43_000],
      ["Transport & Delivery", 5_000],
    ]);
  });
});

describe("buildLoggingInsight", () => {
  it("compares the category that got the most money with the same point last month", () => {
    const insight = buildLoggingInsight({
      added: new Map([
        ["Transport & Delivery", 5_000],
        ["Raw Materials", 25_000],
      ]),
      spentThisMonth: new Map([
        ["Raw Materials", 320_000],
        ["Transport & Delivery", 50_000],
      ]),
      spentLastMonthToDate: new Map([["Raw Materials", 400_000]]),
    });

    expect(insight).toEqual({
      category: "Raw Materials",
      spent: 320_000,
      previousSpent: 400_000,
      difference: -80_000,
    });
  });

  it("treats a category with no spending last month as zero", () => {
    const insight = buildLoggingInsight({
      added: new Map([["Raw Materials", 25_000]]),
      spentThisMonth: new Map([["Raw Materials", 25_000]]),
      spentLastMonthToDate: new Map(),
    });

    expect(insight).toEqual({
      category: "Raw Materials",
      spent: 25_000,
      previousSpent: 0,
      difference: 25_000,
    });
  });
});
