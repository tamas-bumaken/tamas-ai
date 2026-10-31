import { describe, expect, it, vi } from "vitest";
import { Profile } from "@/types/profile";

// Only the declared tool names are read; the mock keeps Gemini out of the test.
vi.mock("@/lib/embedding", () => ({ generateEmbedding: vi.fn() }));

const { PERSONAL_TOOL_DECLARATIONS } = await import("./personal-tools");
const { buildSystemInstruction } = await import("./system-instruction");

const PROFILE: Profile = {
  id: "user-1",
  username: "pemilik_warung",
  business_name: "Warung Bu Ayu",
  business_type: "food_stall",
  regency: "gianyar",
  tourist_dependence: "high",
};

describe("buildSystemInstruction", () => {
  const personal = buildSystemInstruction({
    mode: "personal",
    profile: PROFILE,
  });
  const general = buildSystemInstruction({ mode: "general" });

  it("speaks to micro-business owners in Bali, not young salary earners", () => {
    for (const prompt of [personal, general]) {
      expect(prompt).toContain("micro-business");
      expect(prompt).toContain("Bali");
      expect(prompt).not.toMatch(/18–30|young people|salary/i);
    }
  });

  it("tells the model about every tool it is given", () => {
    for (const { name } of PERSONAL_TOOL_DECLARATIONS) {
      expect(personal).toContain(name);
    }
  });

  it("names the figures the summary tool returns, so the model quotes instead of calculating", () => {
    for (const figure of [
      "profit",
      "profit_margin_percent",
      "owner_taken",
      "cash_left",
    ]) {
      expect(personal).toContain(figure);
    }
  });

  it("includes the business profile only when the advisor may read it", () => {
    expect(personal).toContain("Warung Bu Ayu");
    expect(general).not.toContain("<user_profile>");
    expect(general).not.toContain("get_business_summary");
  });

  it("states the limits on advice in both modes", () => {
    for (const prompt of [personal, general]) {
      expect(prompt).toContain("KUR");
      expect(prompt).toMatch(/specific investment products/i);
      expect(prompt).toMatch(/tax or legal/i);
    }
  });

  it("still forbids Markdown tables, which do not fit the drawer", () => {
    expect(personal).toContain("Never use Markdown tables");
  });
});
