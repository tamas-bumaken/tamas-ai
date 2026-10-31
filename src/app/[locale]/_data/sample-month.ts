import { EXPENSE_CATEGORIES } from "@/constans/transaction-categories";

// One illustrative month shared by every landing section, so the figures in the hero chat,
// the breakdown and the Advisor answers always agree with each other.
// Category names are checked against the app's expense categories, so the page only shows categories the app has.
export const SAMPLE_MONTH = {
  income: 6_000_000,
  previousExpense: 4_150_000,
  categories: [
    { name: "Raw Materials", amount: 1_500_000, swatch: "bg-chart-1" },
    { name: "Rent & Utilities", amount: 1_200_000, swatch: "bg-chart-2" },
    { name: "Staff Wages", amount: 800_000, swatch: "bg-chart-3" },
    { name: "Transport & Delivery", amount: 700_000, swatch: "bg-chart-4" },
    { name: "Other Business Expense", amount: 300_000, swatch: "bg-chart-5" },
  ],
} as const satisfies {
  income: number;
  previousExpense: number;
  categories: readonly {
    name: (typeof EXPENSE_CATEGORIES)[number];
    amount: number;
    swatch: string;
  }[];
};

export type SampleCategoryName =
  (typeof SAMPLE_MONTH.categories)[number]["name"];

// Mirrors the 20% target on the dashboard's savings card.
export const SAVINGS_TARGET_PERCENT = 20;

// The trim the Advisor suggests: Shopping from Rp800.000 down to Rp500.000.
export const SHOPPING_TRIM = 300_000;

const EMERGENCY_FUND_MONTHS_OF_EXPENSES = 3;

export const expense = SAMPLE_MONTH.categories.reduce(
  (total, category) => total + category.amount,
  0,
);
export const saved = SAMPLE_MONTH.income - expense;
export const savingsRatePercent = Math.trunc(
  (saved / SAMPLE_MONTH.income) * 100,
);
export const spendingIncrease = expense - SAMPLE_MONTH.previousExpense;
export const emergencyFundTarget = expense * EMERGENCY_FUND_MONTHS_OF_EXPENSES;
export const monthsToEmergencyFund = Math.ceil(emergencyFundTarget / saved);
export const monthsToEmergencyFundWithTrim = Math.ceil(
  emergencyFundTarget / (saved + SHOPPING_TRIM),
);
