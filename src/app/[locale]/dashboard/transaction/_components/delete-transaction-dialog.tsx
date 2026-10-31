import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useCategoryLabel } from "@/hooks/use-category-label";
import {
  deleteTransaction,
  getTransactions,
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

type TransactionRow = Awaited<
  ReturnType<typeof getTransactions>
>["data"][number];

export default function DeleteTransactionDialog({
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
  const t = useTranslations("transactions.delete");
  const tCommon = useTranslations("common");
  const categoryLabel = useCategoryLabel();
  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteTransaction(transaction.id),
    onSuccess: () => {
      onOpenChange(false);
      refetch();
      toast.success(t("success"));
    },
    // Thrown server messages are hidden in production, so the user gets a readable one.
    onError: () => toast.error(t("failed")),
  });

  return (
    <Dialog
      open={open}
      // Keep the dialog open while the delete is in flight so the result is not lost.
      onOpenChange={(nextOpen) => !isPending && onOpenChange(nextOpen)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t.rich("description", {
              name:
                transaction.description || categoryLabel(transaction.category),
              amount: convertToIDR(transaction.amount),
              strong: (chunks) => (
                <span className="font-medium text-foreground">{chunks}</span>
              ),
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              {tCommon("cancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => mutate()}
          >
            {isPending && <Loader2Icon className="animate-spin" />}
            {isPending ? tCommon("deleting") : tCommon("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
