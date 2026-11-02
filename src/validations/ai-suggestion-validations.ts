import z from "zod";

// Applied to what Gemini returns and to what comes back from the cache, so a bad row is treated as a miss.
export const aiSuggestionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .transform((text) => text.slice(0, 60)),
  explanation: z
    .string()
    .trim()
    .min(1)
    .transform((text) => text.slice(0, 300)),
  actionLabel: z
    .string()
    .trim()
    .min(1)
    .transform((text) => text.slice(0, 40)),
  actionMessage: z
    .string()
    .trim()
    .min(1)
    .transform((text) => text.slice(0, 500)),
});

export type AISuggestion = z.infer<typeof aiSuggestionSchema>;
