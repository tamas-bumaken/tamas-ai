import { useState } from "react";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTransactions } from "@/actions/transaction/actions";
import DeleteTransactionDialog from "./delete-transaction-dialog";
import UpdateTransactionDialog from "./update-transaction-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TransactionRow = Awaited<
  ReturnType<typeof getTransactions>
>["data"][number];

export default function TransactionRowActions({
  transaction,
  onUpdated,
  onDeleted,
}: {
  transaction: TransactionRow;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations("transactions.table");
  const tCommon = useTranslations("common");
  // The dialogs live outside the menu: a dialog rendered inside a menu item
  // would unmount as soon as the menu closes.
  const [activeDialog, setActiveDialog] = useState<"update" | "delete" | null>(
    null,
  );

  const closeDialog = (open: boolean) => {
    if (!open) setActiveDialog(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground max-md:size-11"
            aria-label={t("actions")}
          >
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setActiveDialog("update")}>
            <PencilIcon />
            {tCommon("edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setActiveDialog("delete")}
          >
            <Trash2Icon />
            {tCommon("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <UpdateTransactionDialog
        transaction={transaction}
        open={activeDialog === "update"}
        onOpenChange={closeDialog}
        refetch={onUpdated}
      />
      <DeleteTransactionDialog
        transaction={transaction}
        open={activeDialog === "delete"}
        onOpenChange={closeDialog}
        refetch={onDeleted}
      />
    </>
  );
}
