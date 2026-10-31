import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  BUSINESS_EXPENSE_CATEGORIES,
  BUSINESS_INCOME_CATEGORIES,
  CATEGORIES_BY_TYPE,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  isCategoryOfType,
  TRANSACTION_CATEGORIES,
} from "./transaction-categories";

describe("business categories", () => {
  it("keeps owner money and loans out of the categories that count toward profit", () => {
    for (const category of [
      "Owner Capital",
      "Owner Withdrawal",
      "Ceremony & Adat",
      "Loan Installments",
    ]) {
      expect(BUSINESS_INCOME_CATEGORIES).not.toContain(category);
      expect(BUSINESS_EXPENSE_CATEGORIES).not.toContain(category);
    }
  });

  it("puts every profit category in the list of its own type", () => {
    for (const category of BUSINESS_INCOME_CATEGORIES) {
      expect(isCategoryOfType(category, "income")).toBe(true);
    }
    for (const category of BUSINESS_EXPENSE_CATEGORIES) {
      expect(isCategoryOfType(category, "expense")).toBe(true);
    }
  });

  it("does not let an expense category be recorded as income", () => {
    expect(isCategoryOfType("Raw Materials", "income")).toBe(false);
    expect(isCategoryOfType("Sales", "expense")).toBe(false);
  });

  it("lists each category once", () => {
    expect(new Set(TRANSACTION_CATEGORIES).size).toBe(
      TRANSACTION_CATEGORIES.length,
    );
    expect(TRANSACTION_CATEGORIES).toHaveLength(
      CATEGORIES_BY_TYPE.income.length + CATEGORIES_BY_TYPE.expense.length,
    );
  });
});

describe("transactions_category_check", () => {
  const migration = readFileSync(
    "migrations/006-business-categories.sql",
    "utf8",
  );
  // The constraint is the last statement that names categories per type.
  const constraint = migration.slice(
    migration.indexOf("ADD CONSTRAINT transactions_category_check"),
  );
  const listOf = (type: "income" | "expense") => {
    const list = constraint.match(
      new RegExp(`type = '${type}' AND category IN \\(([^)]*)\\)`),
    )?.[1];

    return [...(list ?? "").matchAll(/'([^']+)'/g)].map((match) => match[1]);
  };

  it("mirrors the expense list", () => {
    expect(listOf("expense").toSorted()).toEqual(
      [...EXPENSE_CATEGORIES].toSorted(),
    );
  });

  it("mirrors the income list", () => {
    expect(listOf("income").toSorted()).toEqual(
      [...INCOME_CATEGORIES].toSorted(),
    );
  });
});
