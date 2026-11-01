import { formatIDR } from "../_lib/format-idr";
import {
  OWNER_WITHDRAWAL_TRIM,
  SAMPLE_MONTH,
  businessCosts,
  cashLeft,
  profit,
} from "./sample-month";

const [rawMaterials] = SAMPLE_MONTH.categories;

// The wording lives in the "landing.advisor.questions" messages; these are the figures each answer quotes.
export const ADVISOR_QUESTIONS = [
  {
    key: "profit",
    values: {
      profit: formatIDR(profit),
      sales: formatIDR(SAMPLE_MONTH.sales),
      costs: formatIDR(businessCosts),
    },
  },
  {
    key: "biggestCost",
    values: { rawMaterials: formatIDR(rawMaterials.amount) },
  },
  {
    key: "cash",
    values: {
      profit: formatIDR(profit),
      owner: formatIDR(SAMPLE_MONTH.ownerWithdrawal.amount),
      ceremony: formatIDR(SAMPLE_MONTH.ceremony.amount),
      cashLeft: formatIDR(cashLeft),
    },
  },
  {
    key: "fix",
    values: {
      ownerCap: formatIDR(
        SAMPLE_MONTH.ownerWithdrawal.amount - OWNER_WITHDRAWAL_TRIM,
      ),
      trim: formatIDR(OWNER_WITHDRAWAL_TRIM),
    },
  },
] as const;
