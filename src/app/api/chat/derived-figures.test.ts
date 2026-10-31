import { describe, expect, it } from "vitest";
import {
  change,
  dailyAverage,
  elapsedDays,
  isWithinOneMonth,
  percentOfMonthlyIncome,
} from "./derived-figures";

describe("elapsedDays", () => {
  it("counts a month asked for mid-month only up to today", () => {
    expect(elapsedDays("2026-10-01", "2026-10-31", "2026-10-23")).toBe(23);
  });

  it("counts a finished range in full, both ends included", () => {
    expect(elapsedDays("2026-09-01", "2026-09-30", "2026-10-23")).toBe(30);
    expect(elapsedDays("2026-10-23", "2026-10-23", "2026-10-23")).toBe(1);
  });

  it("crosses month and year boundaries", () => {
    expect(elapsedDays("2026-12-25", "2027-01-05", "2027-02-01")).toBe(12);
    expect(elapsedDays("2028-02-01", "2028-02-29", "2028-03-10")).toBe(29);
  });

  it("is zero for a range that has not started yet", () => {
    expect(elapsedDays("2026-11-01", "2026-11-30", "2026-10-23")).toBe(0);
  });
});

describe("dailyAverage", () => {
  it("rounds to whole rupiah", () => {
    expect(dailyAverage(717_000, 23)).toBe(31_174);
  });

  it("is null when no day has passed", () => {
    expect(dailyAverage(500_000, 0)).toBeNull();
  });
});

describe("percentOfMonthlyIncome", () => {
  it("is the truncated share of the profile income for a range within one month", () => {
    expect(isWithinOneMonth("2026-10-01", "2026-10-23")).toBe(true);
    expect(
      percentOfMonthlyIncome(717_000, 10_000_000, "2026-10-01", "2026-10-23"),
    ).toBe(7.1);
  });

  it("is null across months or without an income", () => {
    expect(
      percentOfMonthlyIncome(717_000, 10_000_000, "2026-09-15", "2026-10-15"),
    ).toBeNull();
    expect(
      percentOfMonthlyIncome(717_000, null, "2026-10-01", "2026-10-23"),
    ).toBeNull();
    expect(
      percentOfMonthlyIncome(717_000, 0, "2026-10-01", "2026-10-23"),
    ).toBeNull();
  });
});

describe("change", () => {
  it("returns the difference and the truncated percentage change", () => {
    expect(change(717_000, 900_000)).toEqual({
      difference: -183_000,
      percent_change: -20.3,
    });
    expect(change(1_200_000, 1_000_000)).toEqual({
      difference: 200_000,
      percent_change: 20,
    });
  });

  it("has no percentage against a previous value of zero", () => {
    expect(change(150_000, 0)).toEqual({
      difference: 150_000,
      percent_change: null,
    });
  });
});
