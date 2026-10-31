import { describe, expect, it } from "vitest";
import { Profile } from "@/types/profile";
import { buildUserContext } from "./user-context";

const EMPTY_PROFILE: Profile = {
  id: "user-1",
  username: "pemilik_warung",
  business_name: null,
  business_type: null,
  regency: null,
  tourist_dependence: null,
};

describe("buildUserContext", () => {
  it("describes the business the advisor is talking to", () => {
    const context = buildUserContext({
      ...EMPTY_PROFILE,
      business_name: "Warung Bu Ayu",
      business_type: "food_stall",
      regency: "gianyar",
      tourist_dependence: "high",
    });

    expect(context).toContain("- Business name: Warung Bu Ayu");
    expect(context).toContain("- Business type: Food stall or restaurant");
    expect(context).toContain("- Location: Gianyar, Bali");
    expect(context).toContain("- Reliance on tourists: Mostly tourists");
  });

  it("says an answer is missing instead of inventing one", () => {
    const context = buildUserContext(EMPTY_PROFILE);

    expect(context).toContain("- Business name: not provided");
    expect(context).toContain("- Business type: not provided");
    expect(context).toContain("- Location: not provided");
    expect(context).toContain("- Reliance on tourists: not provided");
  });

  it("no longer sends personal finance answers", () => {
    const context = buildUserContext(EMPTY_PROFILE);

    expect(context).not.toMatch(/income|age|goal|dependent|loan/i);
  });
});
