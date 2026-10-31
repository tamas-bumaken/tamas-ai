import { TransactionPayload } from "@/validations/transaction-validations";

// A transaction the wizard drafted from a quick entry, held in the browser until the user saves it.
export type WizardDraft = {
  // Client-side key only; the row gets its database id when saved.
  key: string;
  payload: TransactionPayload;
  // Whether the user changed the model's draft, reported with the save (input quality metric).
  edited: boolean;
};
