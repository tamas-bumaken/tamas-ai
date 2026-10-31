import { TransactionCategory } from "@/constans/transaction-categories";

// The quick-entry example in "How it works": what the user types and the description the wizard writes live in the
// "landing.quickEntry" messages; these are the fields the wizard fills in.
export const SAMPLE_QUICK_ENTRY = {
  category: "Food",
  amount: 25_000,
} as const satisfies {
  category: TransactionCategory;
  amount: number;
};
