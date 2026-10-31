import z from "zod";
import { FINANCIAL_GOAL_VALUES } from "@/constans/financial-goals";
import { usernameSchema } from "./auth-validations";

const MIN_BIRTH_YEAR = 1900;
const MIN_USER_AGE = 13;
// Must match the CHECK constraint on profiles.dependents (and the "dependentsRange" message).
const MAX_DEPENDENTS = 20;

// Number inputs hand over strings; an empty one means "not provided".
function optionalNumberString(
  isValid: (value: number) => boolean,
  message: string,
) {
  return z
    .string()
    .trim()
    .refine((value) => value === "" || isValid(Number(value)), message);
}

export const profileFormSchema = z.object({
  username: usernameSchema,
});

export type ProfileForm = z.infer<typeof profileFormSchema>;

// Every answer is optional: a partial profile still makes the AI Advisor more specific.
export const personalContextFormSchema = z.object({
  monthly_income: optionalNumberString(
    (value) => Number.isFinite(value) && value >= 0,
    "numberNotNegative",
  ),
  // The current year is checked here because the database CHECK cannot use now().
  birth_year: optionalNumberString(
    (value) =>
      Number.isInteger(value) &&
      value >= MIN_BIRTH_YEAR &&
      value <= new Date().getFullYear() - MIN_USER_AGE,
    "birthYearInvalid",
  ),
  financial_goal: z.enum(FINANCIAL_GOAL_VALUES).or(z.literal("")),
  dependents: optionalNumberString(
    (value) => Number.isInteger(value) && value >= 0 && value <= MAX_DEPENDENTS,
    "dependentsRange",
  ),
  has_debt: z.enum(["yes", "no", ""]),
});

export type PersonalContextForm = z.infer<typeof personalContextFormSchema>;

export const onboardingFormSchema = personalContextFormSchema.extend({
  consent: z.boolean().refine((value) => value, "consentRequired"),
});

export type OnboardingForm = z.infer<typeof onboardingFormSchema>;

// Typed by the user before their account is deleted, so the action cannot run from a stray click.
export const DELETE_ACCOUNT_CONFIRMATION = "DELETE";

export const deleteAccountSchema = z.object({
  confirmation: z.literal(DELETE_ACCOUNT_CONFIRMATION, {
    error: "deleteConfirmation",
  }),
});
