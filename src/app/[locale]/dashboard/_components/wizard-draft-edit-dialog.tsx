"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { isTransactionCategory } from "@/constans/transaction-categories";
import { TransactionPayload } from "@/validations/transaction-validations";
import {
  TransactionForm,
  transactionFormSchema,
} from "../transaction/transaction-validations";
import TransactionFormFields from "../transaction/_components/transaction-form-fields";
import { WizardDraft } from "./wizard-draft";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";

// Same fields and rules as the manual form, so an edited draft is held to the same standard.
function DraftForm({
  draft,
  onApply,
}: {
  draft: WizardDraft;
  onApply: (payload: TransactionPayload) => void;
}) {
  const t = useTranslations("wizard.editDialog");
  const tCommon = useTranslations("common");
  const { payload } = draft;
  const form = useForm<TransactionForm>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      amount: String(payload.amount),
      type: payload.type,
      category: isTransactionCategory(payload.category)
        ? payload.category
        : undefined,
      date: payload.date,
      description: payload.description,
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((data) =>
        onApply({ ...data, amount: parseFloat(data.amount) }),
      )}
    >
      <FieldGroup className="gap-3">
        <TransactionFormFields control={form.control} idPrefix="draft" />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {tCommon("cancel")}
            </Button>
          </DialogClose>
          <Button type="submit">{t("apply")}</Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}

export default function WizardDraftEditDialog({
  draft,
  onApply,
  onClose,
}: {
  draft: WizardDraft | null;
  onApply: (key: string, payload: TransactionPayload) => void;
  onClose: () => void;
}) {
  const t = useTranslations("wizard.editDialog");

  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {draft && (
          // Keyed by draft, so opening another draft starts from its own values.
          <DraftForm
            key={draft.key}
            draft={draft}
            onApply={(payload) => onApply(draft.key, payload)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
