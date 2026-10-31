import { describe, expect, it } from "vitest";
import {
  getProjectionInsight,
  getTrendScale,
  niceCeil,
  projectMonthEnd,
} from "./profit-trend";

const NOVEMBER = {
  businessIncome: 3_000_000,
  businessExpense: 1_800_000,
  profit: 1_200_000,
  ownerTaken: 300_000,
};

describe("projectMonthEnd", () => {
  it("extends this month's daily pace to the end of the month", () => {
    expect(projectMonthEnd(NOVEMBER, "2026-11-10")).toEqual({
      status: "ready",
      profit: 3_600_000,
      ownerTaken: 900_000,
    });
  });

  it("uses the real length of the month", () => {
    const projection = projectMonthEnd(NOVEMBER, "2027-02-14");

    expect(projection).toMatchObject({ profit: 2_400_000 });
  });

  it("rounds to thousands, because the figure is only an estimate", () => {
    const projection = projectMonthEnd(
      { ...NOVEMBER, profit: 1_000_100, ownerTaken: 0 },
      "2026-11-07",
    );

    expect(projection).toMatchObject({ profit: 4_286_000 });
  });

  it("keeps a loss negative", () => {
    const projection = projectMonthEnd(
      { ...NOVEMBER, profit: -500_000 },
      "2026-11-10",
    );

    expect(projection).toMatchObject({ profit: -1_500_000 });
  });

  it("waits for a full week, since one purchase would swing the pace", () => {
    expect(projectMonthEnd(NOVEMBER, "2026-11-06")).toEqual({
      status: "too_early",
    });
    expect(projectMonthEnd(NOVEMBER, "2026-11-07").status).toBe("ready");
  });

  it("has nothing to project on the last day of the month", () => {
    expect(projectMonthEnd(NOVEMBER, "2026-11-30")).toEqual({
      status: "month_end",
    });
  });

  it("needs sales, since costs alone say nothing about the month's profit", () => {
    expect(
      projectMonthEnd(
        {
          businessIncome: 0,
          profit: -400_000,
          ownerTaken: 0,
        },
        "2026-11-10",
      ),
    ).toEqual({ status: "no_sales" });
  });
});

describe("getProjectionInsight", () => {
  const previous = { profit: 2_000_000, hasRecords: true };

  it("compares the estimate with last month", () => {
    expect(
      getProjectionInsight({ profit: 3_000_000, ownerTaken: 0 }, previous).key,
    ).toBe("higher");
    expect(
      getProjectionInsight({ profit: 1_000_000, ownerTaken: 0 }, previous).key,
    ).toBe("lower");
  });

  it("does not call a difference of a few percent a change", () => {
    expect(
      getProjectionInsight({ profit: 2_050_000, ownerTaken: 0 }, previous).key,
    ).toBe("similar");
  });

  it("warns about a loss before anything else", () => {
    expect(
      getProjectionInsight({ profit: -100_000, ownerTaken: 0 }, previous).key,
    ).toBe("loss");
  });

  it("does not compare with a month that has no records", () => {
    expect(
      getProjectionInsight(
        { profit: 1_000_000, ownerTaken: 0 },
        { profit: 0, hasRecords: false },
      ).key,
    ).toBe("noPrevious");
  });

  it("flags an owner on course to take more than the business earns", () => {
    expect(
      getProjectionInsight(
        { profit: 1_000_000, ownerTaken: 1_500_000 },
        previous,
      ).takenMoreThanProfit,
    ).toBe(true);
    expect(
      getProjectionInsight({ profit: 1_000_000, ownerTaken: 500_000 }, previous)
        .takenMoreThanProfit,
    ).toBe(false);
  });
});

describe("niceCeil", () => {
  it("rounds up to a clean axis value", () => {
    expect(niceCeil(0)).toBe(0);
    expect(niceCeil(1_000_000)).toBe(1_000_000);
    expect(niceCeil(1_200_000)).toBe(2_000_000);
    expect(niceCeil(3_400_000)).toBe(5_000_000);
    expect(niceCeil(7_000_000)).toBe(10_000_000);
  });
});

describe("getTrendScale", () => {
  it("puts the baseline at the bottom when no month made a loss", () => {
    const scale = getTrendScale([0, 1_200_000]);

    expect(scale).toMatchObject({
      top: 2_000_000,
      bottom: 0,
      baselinePercent: 0,
    });
    expect(scale.heightPercent(1_000_000)).toBe(50);
  });

  it("makes room below the baseline for a loss, on one scale", () => {
    const scale = getTrendScale([3_000_000, -1_000_000]);

    expect(scale).toMatchObject({
      top: 5_000_000,
      bottom: 1_000_000,
    });
    expect(scale.baselinePercent).toBeCloseTo(16.67, 1);
    expect(scale.heightPercent(-1_000_000)).toBeCloseTo(16.67, 1);
  });

  it("stays drawable when every value is zero", () => {
    const scale = getTrendScale([0, 0]);

    expect(scale.heightPercent(0)).toBe(0);
    expect(scale.baselinePercent).toBe(0);
  });
});
