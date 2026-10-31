import z from "zod";
import { TRANSACTION_CATEGORIES } from "@/constans/transaction-categories";

// One message cannot fan out unbounded: each saved draft costs an embedding call and a row.
export const MAX_TRANSACTIONS_PER_MESSAGE = 5;

// The tool schemas below are also sent to Gemini as function parameters, so the .describe() texts double as model guidance.
export const wizardTransactionSchema = z.object({
  amount: z.number().describe("Transaction nominal, a positive number"),
  type: z.enum(["income", "expense"]).describe("Type of transaction"),
  // The type-fit rule lives in transactionPayloadSchema: a refine here would break .partial() below.
  category: z
    .enum(TRANSACTION_CATEGORIES)
    .describe("Category of transaction; must be listed for its type"),
  description: z.string().describe("Short text for describing transaction"),
  date: z.string().describe("The date of transaction in YYYY-MM-DD format"),
});

const transactionIdSchema = z
  .uuid()
  .describe("Id of the transaction, taken from a search_transactions result");

export const wizardUpdateArgsSchema = wizardTransactionSchema.partial().extend({
  id: transactionIdSchema,
});

export const wizardDeleteArgsSchema = z.object({ id: transactionIdSchema });

export const wizardSearchArgsSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional()
    .describe(
      'What the transaction was for, e.g. "kopi" or "gaji". Omit it to list the latest transactions.',
    ),
  start_date: z.iso
    .date()
    .optional()
    .describe("First day to include, YYYY-MM-DD"),
  end_date: z.iso.date().optional().describe("Last day to include, YYYY-MM-DD"),
});
