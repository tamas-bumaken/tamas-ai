import z from "zod";
import {
  BUSINESS_TYPE_VALUES,
  REGENCY_VALUES,
  TOURIST_DEPENDENCE_VALUES,
} from "@/constans/business-profile";
import { usernameSchema } from "./auth-validations";

// Must match the CHECK constraint on profiles.business_name.
const MAX_BUSINESS_NAME_LENGTH = 80;

export const profileFormSchema = z.object({
  username: usernameSchema,
});

export type ProfileForm = z.infer<typeof profileFormSchema>;

// Every answer is optional: a partial profile still makes the AI Advisor more specific.
export const businessProfileFormSchema = z.object({
  business_name: z
    .string()
    .trim()
    .max(MAX_BUSINESS_NAME_LENGTH, "businessNameTooLong"),
  business_type: z.enum(BUSINESS_TYPE_VALUES).or(z.literal("")),
  regency: z.enum(REGENCY_VALUES).or(z.literal("")),
  tourist_dependence: z.enum(TOURIST_DEPENDENCE_VALUES).or(z.literal("")),
});

export type BusinessProfileForm = z.infer<typeof businessProfileFormSchema>;

export const onboardingFormSchema = businessProfileFormSchema.extend({
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
