// Picks the one thing worth saying about this month's cash; figures come from SQL totals. Returns a key of
// "dashboard.cash.insights". Order matters: a loss explains a cash shortfall better than what the owner took.
export function getCashInsightKey({
  businessIncome,
  profit,
  ownerTaken,
  cashIn,
  cashOut,
  cashLeft,
}: {
  businessIncome: number;
  businessExpense: number;
  profit: number;
  ownerTaken: number;
  cashIn: number;
  cashOut: number;
  cashLeft: number;
}) {
  if (cashIn === 0 && cashOut === 0) return "empty";
  if (businessIncome === 0) return "noSales";
  if (profit < 0) return "loss";
  if (ownerTaken > profit) return "takenMoreThanProfit";
  if (cashLeft < 0) return "cashNegative";
  return "healthy";
}
