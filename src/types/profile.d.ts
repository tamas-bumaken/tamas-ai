import { FinancialGoal } from "@/constans/financial-goals";

export type Profile = {
  id: string;
  username: string;
  monthly_income: number | null;
  birth_year: number | null;
  financial_goal: FinancialGoal | null;
  dependents: number | null;
  has_debt: boolean | null;
};
