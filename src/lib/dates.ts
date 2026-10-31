// Users are in Indonesia; a UTC date would still be yesterday before 07:00 WIB.
// en-CA formats as YYYY-MM-DD, the shape of the `date` column and the advisor's tool arguments.
export function getTodayInJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

export type DateRange = { startDate: string; endDate: string };

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Calendar months follow Jakarta time: this month runs from the 1st up to today, last month is the full month.
// `today` is a YYYY-MM-DD date from getTodayInJakarta(); kept as a parameter so the ranges are testable.
export function getMonthRanges(today: string): {
  current: DateRange;
  previous: DateRange;
} {
  const [year, month] = today.split("-").map(Number);

  return {
    current: { startDate: `${today.slice(0, 7)}-01`, endDate: today },
    // Date.UTC rolls month 0 back to December and day 0 back to the previous month's last day.
    previous: {
      startDate: toIsoDate(new Date(Date.UTC(year, month - 2, 1))),
      endDate: toIsoDate(new Date(Date.UTC(year, month - 1, 0))),
    },
  };
}

// Oldest first: `count - 1` full months, then this month up to today.
export function getTrailingMonthRanges(
  today: string,
  count: number,
): DateRange[] {
  const [year, month] = today.split("-").map(Number);

  return Array.from({ length: count }, (_, index) => {
    const monthsBack = count - 1 - index;
    if (monthsBack === 0) return getMonthRanges(today).current;

    return {
      startDate: toIsoDate(new Date(Date.UTC(year, month - 1 - monthsBack, 1))),
      endDate: toIsoDate(new Date(Date.UTC(year, month - monthsBack, 0))),
    };
  });
}

// The same stretch of last month, so a month-to-date total is compared like for like:
// the 1st up to the same day, or up to last month's final day when it is shorter (31 Oct → 1–30 Sep).
export function getPreviousMonthToDate(today: string): DateRange {
  const { previous } = getMonthRanges(today);
  const sameDay = `${previous.startDate.slice(0, 8)}${today.slice(8)}`;

  return {
    startDate: previous.startDate,
    endDate: sameDay < previous.endDate ? sameDay : previous.endDate,
  };
}
