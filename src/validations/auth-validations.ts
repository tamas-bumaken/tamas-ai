import z from "zod";

// Messages are keys of the "validation" messages; FieldError shows them in the user's language.

// Must match the CHECK constraint on profiles.username in migrations/003-profiles.sql.
export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

const MIN_PASSWORD_LENGTH = 8;
// Supabase hashes passwords with bcrypt, which ignores everything past 72 bytes.
const MAX_PASSWORD_LENGTH = 72;

export const signInSchema = z.object({
  email: z.email("emailInvalid"),
  password: z.string().min(1, "passwordRequired"),
});

export type SignInForm = z.infer<typeof signInSchema>;

// Shared by sign-up and password reset, so both enforce the same rules.
const newPasswordSchema = z
  .string()
  // The limits are spelled out in the messages; keep them in step.
  .min(MIN_PASSWORD_LENGTH, "passwordTooShort")
  .max(MAX_PASSWORD_LENGTH, "passwordTooLong");

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(USERNAME_PATTERN, "usernameInvalid");

export const signUpSchema = z
  .object({
    email: z.email("emailInvalid"),
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordsMismatch",
    path: ["confirmPassword"],
  });

export type SignUpForm = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("emailInvalid"),
});

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordsMismatch",
    path: ["confirmPassword"],
  });

export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
