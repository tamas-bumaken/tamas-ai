import z from "zod";
import {
  isCategoryOfType,
  TRANSACTION_CATEGORIES,
} from "@/constans/transaction-categories";

export const transactionFormSchema = z
  .object({
    amount: z
      .string()
      .min(1, "amountRequired")
      .refine((value) => Number(value) > 0, "amountPositive"),
    type: z.enum(["income", "expense"], {
      error: "typeRequired",
    }),
    category: z.enum(TRANSACTION_CATEGORIES, {
      error: "categoryRequired",
    }),
    date: z.iso.date("dateRequired"),
    description: z.string().min(1, "descriptionRequired"),
  })
  .refine(({ category, type }) => isCategoryOfType(category, type), {
    path: ["category"],
    message: "categoryFitsType",
  });

export type TransactionForm = z.infer<typeof transactionFormSchema>;
