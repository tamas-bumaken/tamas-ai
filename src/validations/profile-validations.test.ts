import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  BUSINESS_TYPE_VALUES,
  REGENCY_VALUES,
  TOURIST_DEPENDENCE_VALUES,
} from "@/constans/business-profile";
import { businessProfileFormSchema } from "./profile-validations";

const EMPTY = {
  business_name: "",
  business_type: "",
  regency: "",
  tourist_dependence: "",
};

describe("businessProfileFormSchema", () => {
  it("accepts a complete profile", () => {
    expect(
      businessProfileFormSchema.safeParse({
        business_name: "Warung Bu Ayu",
        business_type: "food_stall",
        regency: "gianyar",
        tourist_dependence: "high",
      }).success,
    ).toBe(true);
  });

  it("leaves every answer optional", () => {
    expect(businessProfileFormSchema.safeParse(EMPTY).success).toBe(true);
  });

  it("trims the business name", () => {
    expect(
      businessProfileFormSchema.parse({
        ...EMPTY,
        business_name: "  Warung Bu Ayu  ",
      }).business_name,
    ).toBe("Warung Bu Ayu");
  });

  it("rejects a name longer than the database allows", () => {
    expect(
      businessProfileFormSchema.safeParse({
        ...EMPTY,
        business_name: "a".repeat(81),
      }).success,
    ).toBe(false);
  });

  it("rejects a regency outside Bali", () => {
    expect(
      businessProfileFormSchema.safeParse({ ...EMPTY, regency: "jakarta" })
        .success,
    ).toBe(false);
  });
});

describe("migration 007", () => {
  const migration = readFileSync("migrations/007-business-profile.sql", "utf8");

  it.each([
    ["business_type", BUSINESS_TYPE_VALUES],
    ["regency", REGENCY_VALUES],
    ["tourist_dependence", TOURIST_DEPENDENCE_VALUES],
  ])("mirrors the values of %s", (column, values) => {
    const list = migration.match(
      new RegExp(`${column} TEXT CHECK \\(\\s*${column} IN \\(([^)]*)\\)`),
    )?.[1];
    const inMigration = [...(list ?? "").matchAll(/'([^']+)'/g)].map(
      (match) => match[1],
    );

    expect(inMigration.toSorted()).toEqual([...values].toSorted());
  });

  it("drops the personal finance columns", () => {
    for (const column of [
      "monthly_income",
      "birth_year",
      "financial_goal",
      "dependents",
      "has_debt",
    ]) {
      expect(migration).toContain(`DROP COLUMN IF EXISTS ${column}`);
    }
  });
});
