import { useTranslations } from "next-intl";
import { createTransaction } from "@/actions/transaction/actions";
import { useCategoryLabel } from "@/hooks/use-category-label";
import { convertToIDR } from "@/lib/utils";

// Read from the action rather than lib/logging-feedback, which is server-only.
type LoggingInsight = NonNullable<
  Awaited<ReturnType<typeof createTransaction>>["insight"]
>;

type FeedbackTranslator = ReturnType<
  typeof useTranslations<"dashboard.loggingFeedback">
>;

// The one-line insight in the success toast (Phase 1 / 1.11). Figures come from the server; this only words them.
export function formatLoggingInsight(
  t: FeedbackTranslator,
  categoryLabel: (category: string) => string,
  insight: LoggingInsight,
): string {
  const base = {
    category: categoryLabel(insight.category),
    spent: convertToIDR(insight.spent),
  };

  const { previousSpent, difference } = insight;
  if (previousSpent === 0) return t("noneLastMonth", base);
  if (difference === 0) return t("sameAsLastMonth", base);

  const values = { ...base, difference: convertToIDR(Math.abs(difference)) };
  return difference > 0
    ? t("moreThanLastMonth", values)
    : t("lessThanLastMonth", values);
}

// Insight text after a save, in the user's language.
export function useLoggingFeedback() {
  const t = useTranslations("dashboard.loggingFeedback");
  const categoryLabel = useCategoryLabel();

  return {
    formatLoggingInsight: (insight: LoggingInsight) =>
      formatLoggingInsight(t, categoryLabel, insight),
  };
}
