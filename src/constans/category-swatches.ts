import { BUSINESS_EXPENSE_CATEGORIES } from "./transaction-categories";

type BusinessExpenseCategory = (typeof BUSINESS_EXPENSE_CATEGORIES)[number];

// A category keeps its colour every month, so the owner can recognise it without reading the label.
export const CATEGORY_SWATCHES = {
  "Raw Materials": "bg-chart-1",
  "Staff Wages": "bg-chart-2",
  "Rent & Utilities": "bg-chart-3",
  "Transport & Delivery": "bg-chart-4",
  "Marketing & Platform Fees": "bg-chart-5",
  Equipment: "bg-chart-6",
  "Other Business Expense": "bg-chart-7",
} as const satisfies Record<BusinessExpenseCategory, string>;

export function getCategorySwatch(category: string) {
  const swatches: Record<string, string> = CATEGORY_SWATCHES;

  return swatches[category] ?? CATEGORY_SWATCHES["Other Business Expense"];
}
