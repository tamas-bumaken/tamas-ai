import { formatIDR } from "../_lib/format-idr";
import {
  SAMPLE_MONTH,
  SHOPPING_TRIM,
  emergencyFundTarget,
  monthsToEmergencyFund,
  monthsToEmergencyFundWithTrim,
  saved,
  spendingIncrease,
} from "./sample-month";

const [food, , shopping] = SAMPLE_MONTH.categories;

// The wording lives in the "landing.advisor.questions" messages; these are the figures each answer quotes.
export const ADVISOR_QUESTIONS = [
  { key: "biggest", values: { food: formatIDR(food.amount) } },
  {
    key: "trend",
    values: {
      increase: formatIDR(spendingIncrease),
      previous: formatIDR(SAMPLE_MONTH.previousExpense),
    },
  },
  {
    key: "cut",
    values: {
      shopping: formatIDR(shopping.amount),
      shoppingCap: formatIDR(shopping.amount - SHOPPING_TRIM),
      trim: formatIDR(SHOPPING_TRIM),
      trimYear: formatIDR(SHOPPING_TRIM * 12),
    },
  },
  {
    key: "emergencyFund",
    values: {
      target: formatIDR(emergencyFundTarget),
      saved: formatIDR(saved),
      months: monthsToEmergencyFund,
      monthsWithTrim: monthsToEmergencyFundWithTrim,
    },
  },
] as const;
