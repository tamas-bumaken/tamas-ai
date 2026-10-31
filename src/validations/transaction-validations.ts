import z from "zod";
import {
  isCategoryOfType,
  TRANSACTION_CATEGORIES,
} from "@/constans/transaction-categories";

// Bounds the text sent to the embedding model on every create and update.
const MAX_DESCRIPTION_LENGTH = 200;

export const transactionIdSchema = z.uuid();

// Where a create or edit came from; only used for analytics, so a spoofed value skews numbers, nothing else.
export const transactionSourceSchema = z.enum(["manual", "wizard"]);

export type TransactionSource = z.infer<typeof transactionSourceSchema>;

// Server-side twin of the transaction form schema: the actions are public endpoints, so client checks do not count.
// Unknown keys are stripped, so a caller cannot write columns such as id or created_at through the payload.
export const transactionPayloadSchema = z
  .object({
    amount: z.number().positive().finite(),
    type: z.enum(["income", "expense"]),
    category: z.enum(TRANSACTION_CATEGORIES),
    // May be empty: rows saved before descriptions were required have none, and the wizard can update them.
    description: z.string().trim().max(MAX_DESCRIPTION_LENGTH),
    date: z.iso.date(),
  })
  // Same rule as transactions_category_check, so a mismatch fails here instead of as a database error.
  .refine(({ category, type }) => isCategoryOfType(category, type), {
    path: ["category"],
    message: "Category does not fit the transaction type",
  });

export type TransactionPayload = z.infer<typeof transactionPayloadSchema>;
