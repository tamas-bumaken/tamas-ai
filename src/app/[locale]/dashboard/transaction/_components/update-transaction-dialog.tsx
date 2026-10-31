import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  getTransactions,
  updateTransaction,
} from "@/actions/transaction/actions";
import {
  TransactionForm,
  transactionFormSchema,
} from "../transaction-validations";
import TransactionFormFields from "./transaction-form-fields";
import { isTransactionCategory } from "@/constans/transaction-categories";
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

type TransactionRow = Awaited<
  ReturnType<typeof getTransactions>
>["data"][number];

export default function UpdateTransactionDialog({
  transaction,
  open,
  onOpenChange,
  refetch,
}: {
  transaction: TransactionRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refetch: () => void;
}) {
  const t = useTranslations("transactions.update");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {/* Rendered inside DialogContent so the form mounts with fresh row values on every open. */}
        <UpdateTransactionForm
          transaction={transaction}
          onUpdated={() => {
            onOpenChange(false);
            refetch();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function UpdateTransactionForm({
  transaction,
  onUpdated,
}: {
  transaction: TransactionRow;
  onUpdated: () => void;
}) {
  const t = useTranslations("transactions.update");
  const tCommon = useTranslations("common");
  const form = useForm<TransactionForm>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      amount: String(transaction.amount),
      type: transaction.type,
      // A value outside the list leaves the field empty, so the user picks a valid one.
      category: isTransactionCategory(transaction.category)
        ? transaction.category
        : undefined,
      date: transaction.date,
      description: transaction.description ?? "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: TransactionForm) =>
      updateTransaction(
        transaction.id,
        { ...data, amount: parseFloat(data.amount) },
        "manual",
      ),
    onSuccess: () => {
      onUpdated();
      toast.success(t("success"));
    },
    // Thrown server messages are hidden in production, so the user gets a readable one.
    onError: () => toast.error(t("failed")),
  });

  const onSubmit = (data: TransactionForm) => {
    mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup className="gap-3">
        <TransactionFormFields control={form.control} idPrefix="update-form" />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              {tCommon("cancel")}
            </Button>
          </DialogClose>
          <Button type="submit" disabled={!form.formState.isDirty || isPending}>
            {isPending && <Loader2Icon className="animate-spin" />}
            {isPending ? tCommon("saving") : t("submit")}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}
