import { TransactionPayload } from "@/validations/transaction-validations";

// An existing row as the wizard found it.
export type WizardTransactionRow = {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  date: string;
};

// Changes to existing rows are only proposed; the user confirms them before they are applied.
export type WizardProposal =
  | {
      kind: "update";
      before: WizardTransactionRow;
      // Already parsed with transactionPayloadSchema, so it can be sent to updateTransaction as-is.
      after: { id: string } & TransactionPayload;
    }
  | { kind: "delete"; transaction: WizardTransactionRow };

export type WizardResult = {
  // New transactions the user still has to review and save; nothing is stored yet.
  drafts: TransactionPayload[];
  proposals: WizardProposal[];
};
