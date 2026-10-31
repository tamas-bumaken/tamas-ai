import { describe, expect, it } from "vitest";
import { toConversationTitle } from "./advisor-history";

describe("toConversationTitle", () => {
  it("keeps a short question as it is, minus extra spaces", () => {
    expect(toConversationTitle("  Berapa total   makan bulan ini? ")).toBe(
      "Berapa total makan bulan ini?",
    );
  });

  it("shortens a long question on a word boundary", () => {
    const title = toConversationTitle(
      "Tolong bandingkan pengeluaran makan dan transportasi bulan ini dengan bulan lalu ya",
    );

    expect(title).toBe(
      "Tolong bandingkan pengeluaran makan dan transportasi bulan…",
    );
    expect(title.length).toBeLessThanOrEqual(61);
  });

  it("cuts a single long word instead of returning an empty title", () => {
    expect(toConversationTitle("a".repeat(100))).toBe(`${"a".repeat(60)}…`);
  });
});
