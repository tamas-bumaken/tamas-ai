import { FINANCIAL_GOAL_LABELS } from "@/constans/financial-goals";
import { Profile } from "@/types/profile";

// The app records and shows every amount in rupiah.
const CURRENCY = "IDR";

const NOT_PROVIDED = "not provided";

// Users are in Indonesia; around New Year a UTC year would be off by one before 07:00 WIB.
function getCurrentYearInJakarta(): number {
  return Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
    }).format(new Date()),
  );
}

// Built on the server from the database, never from the request body, so a client cannot rewrite who the model thinks it is advising.
export function buildUserContext(profile: Profile): string {
  const formatMoney = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format;

  const lines = [
    `- Monthly income: ${
      profile.monthly_income === null
        ? NOT_PROVIDED
        : formatMoney(profile.monthly_income)
    }`,
    // Only the birth year is stored, so the age can be off by one.
    `- Age: ${
      profile.birth_year === null
        ? NOT_PROVIDED
        : `about ${getCurrentYearInJakarta() - profile.birth_year}`
    }`,
    `- Main financial goal: ${
      profile.financial_goal === null
        ? NOT_PROVIDED
        : FINANCIAL_GOAL_LABELS[profile.financial_goal]
    }`,
    `- People who depend on their income: ${profile.dependents ?? NOT_PROVIDED}`,
    `- Active loans or installments: ${
      profile.has_debt === null ? NOT_PROVIDED : profile.has_debt ? "yes" : "no"
    }`,
    `- Currency: ${CURRENCY}`,
  ];

  return `<user_profile>\n${lines.join("\n")}\n</user_profile>`;
}
