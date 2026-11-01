export type HowItWorksExample = "quick-entry" | "profit" | "starter-questions";

// Titles and bodies live in the "landing.howItWorks.steps" messages.
export const HOW_IT_WORKS_STEPS = [
  { key: "quickEntry", example: "quick-entry" },
  { key: "dashboard", example: "profit" },
  { key: "starterQuestions", example: "starter-questions" },
] as const satisfies readonly { key: string; example: HowItWorksExample }[];
