// Values must match the CHECK constraint on profiles.financial_goal in migrations/003-profiles.sql.
export const FINANCIAL_GOAL_VALUES = [
  "emergency_fund",
  "pay_off_debt",
  "start_investing",
  "control_spending",
  "save_for_goal",
] as const;

export type FinancialGoal = (typeof FINANCIAL_GOAL_VALUES)[number];

// English names for the Advisor prompt; the UI shows the "financialGoals" messages.
export const FINANCIAL_GOAL_LABELS: Record<FinancialGoal, string> = {
  emergency_fund: "Build an emergency fund",
  pay_off_debt: "Pay off debt",
  start_investing: "Start investing",
  control_spending: "Control my spending",
  save_for_goal: "Save for a specific goal",
};
