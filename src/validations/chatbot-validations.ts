import z from "zod";

// Bounds the tokens a single request can spend, since the whole history is resent every turn.
export const MAX_CHAT_HISTORY_MESSAGES = 30;
const MAX_CHAT_MESSAGE_LENGTH = 32_000;

export const chatbotFormSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "messageRequired")
    .max(MAX_CHAT_MESSAGE_LENGTH, "messageTooLong"),
});

export type ChatbotForm = z.infer<typeof chatbotFormSchema>;

// personal: answers from the user's profile and transactions; general: no access to any user data.
// Set by the server from the Profile setting (Phase 1 / 1.9); clients no longer choose it.
export const chatModeSchema = z.enum(["personal", "general"]);

export type ChatMode = z.infer<typeof chatModeSchema>;

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        text: z.string().trim().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
      }),
    )
    .min(1)
    .max(MAX_CHAT_HISTORY_MESSAGES)
    .refine((messages) => messages.at(-1)?.role === "user", {
      message: "The last message must come from the user",
    }),
  // Created by the browser when a chat starts; the server stores the exchange under it (Phase 1 / 1.8).
  conversationId: z.uuid(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

// Thumbs up/down for now (Phase 1 / 1.10); a finer scale can come once there are enough users to read it.
export const ADVISOR_FEEDBACK_RATINGS = ["up", "down"] as const;

// Asked after a thumbs down. Preset reasons only: free text could carry the user's financial details into analytics.
export const ADVISOR_FEEDBACK_REASONS = [
  "wrong_numbers",
  "not_helpful",
  "too_long",
  "misunderstood",
] as const;

export const advisorFeedbackSchema = z.object({
  rating: z.enum(ADVISOR_FEEDBACK_RATINGS),
  reason: z.enum(ADVISOR_FEEDBACK_REASONS).optional(),
  mode: chatModeSchema,
});

export type AdvisorFeedback = z.infer<typeof advisorFeedbackSchema>;
export type AdvisorFeedbackReason = (typeof ADVISOR_FEEDBACK_REASONS)[number];
