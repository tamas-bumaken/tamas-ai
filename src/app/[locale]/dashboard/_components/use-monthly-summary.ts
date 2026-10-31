import { getMonthlySummary } from "@/actions/transaction/actions";
import { useQuery } from "@tanstack/react-query";
import { useFormatter } from "next-intl";

export type MonthlySummary = Awaited<ReturnType<typeof getMonthlySummary>>;

// "1–17 Oct", or "1 Oct" on the first day of the month.
export function useFormatPeriod() {
  const format = useFormatter();

  return ({ startDate, endDate }: MonthlySummary["current"]) =>
    startDate === endDate
      ? format.dateTime(new Date(endDate), "dayMonth")
      : format.dateTimeRange(
          new Date(startDate),
          new Date(endDate),
          "dayMonth",
        );
}

// Shared by every "this month" card so they read one cached response.
// Under "balance" so every invalidation of the balance also refreshes this month's figures.
export function useMonthlySummary() {
  return useQuery({
    queryKey: ["balance", "this-month"],
    queryFn: () => getMonthlySummary(),
  });
}
