import { useFormatter } from "next-intl";
import { useCategoryLabel } from "@/hooks/use-category-label";
import { cn, convertToIDR } from "@/lib/utils";
import { TransactionPayload } from "@/validations/transaction-validations";

// Shown in the success toast. Built from the rows the server actually saved, not from model text,
// so it cannot misstate what was recorded.
export default function WizardCreatedSummary({
  created,
}: {
  created: TransactionPayload[];
}) {
  const format = useFormatter();
  const categoryLabel = useCategoryLabel();

  return (
    <ul className="w-full divide-y">
      {created.map((transaction, index) => (
        <li
          // Created rows carry no id; each toast renders a fixed list, so the index is stable.
          key={index}
          className="flex items-center justify-between gap-4 py-1.5"
        >
          <div className="min-w-0">
            <p className="truncate text-foreground">
              {transaction.description}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {categoryLabel(transaction.category)} ·{" "}
              {format.dateTime(new Date(transaction.date), "day")}
            </p>
          </div>
          <p
            className={cn(
              "shrink-0 font-medium tabular-nums text-foreground",
              transaction.type === "income" && "text-primary-ink",
            )}
          >
            {transaction.type === "income" ? "+" : "−"}
            {convertToIDR(transaction.amount)}
          </p>
        </li>
      ))}
    </ul>
  );
}
