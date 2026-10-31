import { useTranslations } from "next-intl";
import { isTransactionCategory } from "@/constans/transaction-categories";

// Stored categories stay English (D4); this shows them in the UI language. Unknown values fall back to themselves.
export function useCategoryLabel() {
  const t = useTranslations("categories");

  return (category: string) =>
    isTransactionCategory(category) ? t(category) : category;
}
