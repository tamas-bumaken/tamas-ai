import { Formats } from "next-intl";

// Shared display formats, used as format.dateTime(date, "day"). Transaction dates are calendar days stored as
// YYYY-MM-DD (parsed as UTC midnight), so they are shown in UTC to keep the day the user picked.
export const formats = {
  dateTime: {
    day: { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" },
    dayMonth: { day: "numeric", month: "short", timeZone: "UTC" },
    monthName: { month: "long", timeZone: "UTC" },
  },
} satisfies Formats;
