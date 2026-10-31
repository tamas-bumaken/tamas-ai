"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useFormatter, useTranslations } from "next-intl";
import { useCategoryLabel } from "@/hooks/use-category-label";
import {
  deleteTransaction,
  updateTransaction,
} from "@/actions/transaction/actions";
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
import { convertToIDR } from "@/lib/utils";
import { WizardProposal, WizardTransactionRow } from "@/types/wizard";

// Labels live in "wizard.confirm.fields".
const FIELDS = ["amount", "type", "category", "description", "date"] as const;

type Field = (typeof FIELDS)[number];

// Words one field of a transaction row in the user's language.
function useFormatField() {
  const format = useFormatter();
  const tCommon = useTranslations("common");
  const categoryLabel = useCategoryLabel();

  return (field: Field, row: WizardTransactionRow): string => {
    if (field === "amount") return convertToIDR(row.amount);
    if (field === "date") return format.dateTime(new Date(row.date), "day");
    if (field === "type") return tCommon(row.type);
    if (field === "category") return categoryLabel(row.category);
    return row.description;
  };
}

function useSummarize() {
  const formatField = useFormatField();
  const categoryLabel = useCategoryLabel();

  return (row: WizardTransactionRow) =>
    `${row.description || categoryLabel(row.category)} · ${convertToIDR(row.amount)} · ${formatField("date", row)}`;
}

function applyProposal(proposal: WizardProposal) {
  if (proposal.kind === "delete") {
    return deleteTransaction(proposal.transaction.id);
  }

  const { id, ...fields } = proposal.after;
  return updateTransaction(id, fields, "wizard");
}

function ProposalItem({ proposal }: { proposal: WizardProposal }) {
  const t = useTranslations("wizard.confirm");
  const formatField = useFormatField();
  const summarize = useSummarize();

  if (proposal.kind === "delete") {
    return (
      <li>
        <span className="font-medium text-destructive">{t("delete")}</span>{" "}
        {summarize(proposal.transaction)}
      </li>
    );
  }

  const { before, after } = proposal;
  const changedFields = FIELDS.filter(
    (field) => before[field] !== after[field],
  );

  return (
    <li>
      <span className="font-medium text-foreground">{t("update")}</span>{" "}
      {summarize(before)}
      <ul className="mt-1 ml-4 list-disc">
        {changedFields.map((field) => (
          <li key={field}>
            {t(`fields.${field}`)}: {formatField(field, before)} →{" "}
            <span className="font-medium text-foreground">
              {formatField(field, after)}
            </span>
          </li>
        ))}
      </ul>
    </li>
  );
}

export default function WizardConfirmDialog({
  proposals,
  onClose,
}: {
  proposals: WizardProposal[];
  onClose: () => void;
}) {
  const t = useTranslations("wizard.confirm");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => Promise.all(proposals.map(applyProposal)),
    onSuccess: () => {
      toast.success(t("applied", { count: proposals.length }));
    },
    onError: (error) => {
      toast.error(error.message);
    },
    // Also on error: the changes run in parallel, so some may have been applied before one failed.
    onSettled: () => {
      onClose();
      // Prefix match refreshes both the recent list and the paginated table.
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });

  const hasDelete = proposals.some(({ kind }) => kind === "delete");

  return (
    <Dialog
      open={proposals.length > 0}
      // Keep the dialog open while the changes are in flight so the result is not lost.
      onOpenChange={(nextOpen) => !nextOpen && !isPending && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {hasDelete ? t("descriptionWithDelete") : t("description")}
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
          {proposals.map((proposal) => (
            <ProposalItem
              // The server keeps one proposal per transaction, so its id is unique here.
              key={
                proposal.kind === "delete"
                  ? proposal.transaction.id
                  : proposal.before.id
              }
              proposal={proposal}
            />
          ))}
        </ul>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              {tCommon("cancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant={hasDelete ? "destructive" : "default"}
            disabled={isPending}
            onClick={() => mutate()}
          >
            {isPending && <Loader2Icon className="animate-spin" />}
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
