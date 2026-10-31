import { createTranslator } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../../../../messages/en.json";

// Only the action's return type is used; the mock keeps the server module out of the test.
vi.mock("@/actions/transaction/actions", () => ({}));

const { formatLoggingInsight: format } = await import("./logging-feedback");

const t = createTranslator({
  locale: "en",
  messages: en,
  namespace: "dashboard.loggingFeedback",
});
const formatLoggingInsight = (insight: Parameters<typeof format>[2]) =>
  format(t, (category) => category, insight);

// convertToIDR groups with a dot, the id-ID separator.
describe("formatLoggingInsight", () => {
  it("compares with the same point last month", () => {
    const base = {
      category: "Raw Materials",
      spent: 320_000,
    };

    expect(
      formatLoggingInsight({
        ...base,
        previousSpent: 400_000,
        difference: -80_000,
      }),
    ).toBe(
      "Raw Materials this month: Rp 320.000, Rp 80.000 less than by this point last month.",
    );
    expect(
      formatLoggingInsight({
        ...base,
        previousSpent: 300_000,
        difference: 20_000,
      }),
    ).toBe(
      "Raw Materials this month: Rp 320.000, Rp 20.000 more than by this point last month.",
    );
    expect(
      formatLoggingInsight({ ...base, previousSpent: 320_000, difference: 0 }),
    ).toBe(
      "Raw Materials this month: Rp 320.000, the same as by this point last month.",
    );
    expect(
      formatLoggingInsight({ ...base, previousSpent: 0, difference: 320_000 }),
    ).toBe(
      "Raw Materials this month: Rp 320.000. None by this point last month.",
    );
  });
});
