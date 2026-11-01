import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCurrentYearInJakarta,
  getMonthRanges,
  getTrailingMonthRanges,
  getPreviousMonthToDate,
  getTodayInJakarta,
} from "./dates";

describe("getTodayInJakarta", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is already the next day in Jakarta while UTC is still on the previous one", () => {
    vi.useFakeTimers();
    // 01:00 WIB on 22 October.
    vi.setSystemTime(new Date("2026-10-21T18:00:00Z"));

    expect(getTodayInJakarta()).toBe("2026-10-22");
  });

  it("turns the year at midnight WIB, not midnight UTC", () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2026-12-31T16:59:59Z"));
    expect(getTodayInJakarta()).toBe("2026-12-31");

    vi.setSystemTime(new Date("2026-12-31T17:00:00Z"));
    expect(getTodayInJakarta()).toBe("2027-01-01");
  });
});

describe("getMonthRanges", () => {
  it("runs this month up to today and last month in full", () => {
    expect(getMonthRanges("2026-10-22")).toEqual({
      current: { startDate: "2026-10-01", endDate: "2026-10-22" },
      previous: { startDate: "2026-09-01", endDate: "2026-09-30" },
    });
  });

  it("covers a single day on the first of the month", () => {
    expect(getMonthRanges("2026-10-01").current).toEqual({
      startDate: "2026-10-01",
      endDate: "2026-10-01",
    });
  });

  it("rolls last month back into December of the previous year in January", () => {
    expect(getMonthRanges("2027-01-15").previous).toEqual({
      startDate: "2026-12-01",
      endDate: "2026-12-31",
    });
  });

  it("ends February on the 28th in a common year and the 29th in a leap year", () => {
    expect(getMonthRanges("2026-03-10").previous.endDate).toBe("2026-02-28");
    expect(getMonthRanges("2028-03-10").previous.endDate).toBe("2028-02-29");
  });

  it("ends a 30-day previous month on the 30th even when today is the 31st", () => {
    expect(getMonthRanges("2026-05-31").previous).toEqual({
      startDate: "2026-04-01",
      endDate: "2026-04-30",
    });
  });
});

describe("getPreviousMonthToDate", () => {
  it("runs last month up to the same day", () => {
    expect(getPreviousMonthToDate("2026-10-23")).toEqual({
      startDate: "2026-09-01",
      endDate: "2026-09-23",
    });
  });

  it("stops at last month's final day when it is shorter", () => {
    expect(getPreviousMonthToDate("2026-10-31").endDate).toBe("2026-09-30");
    expect(getPreviousMonthToDate("2026-03-30").endDate).toBe("2026-02-28");
  });

  it("rolls back into December in January", () => {
    expect(getPreviousMonthToDate("2027-01-05")).toEqual({
      startDate: "2026-12-01",
      endDate: "2026-12-05",
    });
  });
});

describe("getTrailingMonthRanges", () => {
  it("lists full past months oldest first and ends with this month up to today", () => {
    expect(getTrailingMonthRanges("2026-11-15", 3)).toEqual([
      { startDate: "2026-09-01", endDate: "2026-09-30" },
      { startDate: "2026-10-01", endDate: "2026-10-31" },
      { startDate: "2026-11-01", endDate: "2026-11-15" },
    ]);
  });

  it("crosses into the previous year", () => {
    expect(getTrailingMonthRanges("2027-02-10", 3)[0]).toEqual({
      startDate: "2026-12-01",
      endDate: "2026-12-31",
    });
  });
});

describe("getCurrentYearInJakarta", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("follows the year in Jakarta, which turns seven hours before UTC does", () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2026-12-31T16:59:59Z"));
    expect(getCurrentYearInJakarta()).toBe("2026");

    vi.setSystemTime(new Date("2026-12-31T17:00:00Z"));
    expect(getCurrentYearInJakarta()).toBe("2027");
  });
});
