import { CATEGORY_SWATCHES } from "@/constans/category-swatches";
import {
  BUSINESS_EXPENSE_CATEGORIES,
  CEREMONY_CATEGORY,
  OWNER_WITHDRAWAL_CATEGORY,
} from "@/constans/transaction-categories";

// One illustrative month of a warung makan, shared by every landing section, so the figures in the hero chat,
// the breakdown and the Advisor answers always agree with each other.
// Category names are checked against the app's cost categories, so the page only shows categories the app has.
export const SAMPLE_MONTH = {
  sales: 18_000_000,
  ownerWithdrawal: {
    name: OWNER_WITHDRAWAL_CATEGORY,
    amount: 3_000_000,
  },
  ceremony: { name: CEREMONY_CATEGORY, amount: 1_000_000 },
  categories: [
    { name: "Raw Materials", amount: 8_500_000 },
    { name: "Staff Wages", amount: 2_500_000 },
    { name: "Rent & Utilities", amount: 1_700_000 },
    { name: "Transport & Delivery", amount: 500_000 },
    { name: "Other Business Expense", amount: 300_000 },
  ],
} as const satisfies {
  sales: number;
  ownerWithdrawal: { name: string; amount: number };
  ceremony: { name: string; amount: number };
  categories: readonly {
    name: (typeof BUSINESS_EXPENSE_CATEGORIES)[number];
    amount: number;
  }[];
};

export function sampleCategorySwatch(
  name: (typeof SAMPLE_MONTH.categories)[number]["name"],
) {
  return CATEGORY_SWATCHES[name];
}

// The trim the Advisor suggests: a monthly limit on what the owner takes out.
export const OWNER_WITHDRAWAL_TRIM = 500_000;

export const businessCosts = SAMPLE_MONTH.categories.reduce(
  (total, category) => total + category.amount,
  0,
);
export const profit = SAMPLE_MONTH.sales - businessCosts;
export const ownerTaken =
  SAMPLE_MONTH.ownerWithdrawal.amount + SAMPLE_MONTH.ceremony.amount;
export const cashLeft = profit - ownerTaken;
