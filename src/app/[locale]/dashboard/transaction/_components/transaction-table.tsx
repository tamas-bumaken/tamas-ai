import { getTransactions } from "@/actions/transaction/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFormatter, useTranslations } from "next-intl";
import { PAGINATIONS_LABEL } from "@/constans/paginations";
import { useCategoryLabel } from "@/hooks/use-category-label";
import { TABELS_HEADER_TRANSACTION } from "@/constans/table-header-transaction";
import { cn, convertToIDR } from "@/lib/utils";
import { Fragment } from "react/jsx-runtime";
import TransactionRowActions from "./transaction-row-actions";

export default function TransactionTable({
  transactions,
  isLoading,
  page,
  limit,
  search,
  refetch,
  setPage,
  setLimit,
  setSearch,
}: {
  transactions?: Awaited<ReturnType<typeof getTransactions>>;
  page: number;
  limit: number;
  search: string;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  isLoading: boolean;
  refetch: () => void;
}) {
  const t = useTranslations("transactions.table");
  const format = useFormatter();
  const categoryLabel = useCategoryLabel();

  const refetchAfterDelete = (rowCount: number) => {
    // Deleting the only row of a later page would leave an empty page.
    if (rowCount === 1 && page > 1) {
      setPage(page - 1);
    } else {
      refetch();
    }
  };

  return (
    <Fragment>
      <Card className="w-full gap-2">
        <CardHeader className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          <div>
            <Input
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchLabel")}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* On phones the six columns would push the amount out of view, so each row stacks instead. */}
          <div className="md:hidden">
            {isLoading && (
              <p className="py-6 text-sm text-muted-foreground">
                {t("loading")}
              </p>
            )}
            {!isLoading && transactions?.data?.length === 0 && (
              <p className="py-6 text-sm text-muted-foreground">{t("empty")}</p>
            )}
            {!isLoading && (
              <ul className="divide-y">
                {transactions?.data?.map((transaction) => (
                  <li
                    key={`li-${transaction.id}`}
                    className="flex items-center gap-2 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {transaction.description ||
                          categoryLabel(transaction.category)}
                      </p>
                      {transaction.description && (
                        <p className="text-sm truncate text-muted-foreground">
                          {categoryLabel(transaction.category)}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={cn(
                          "font-medium tabular-nums",
                          transaction.type === "income" && "text-primary-ink",
                        )}
                      >
                        {transaction.type === "income" ? "+" : "−"}
                        {convertToIDR(transaction.amount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format.dateTime(new Date(transaction.date), "day")}
                      </p>
                    </div>
                    <TransactionRowActions
                      transaction={transaction}
                      onUpdated={refetch}
                      onDeleted={() =>
                        refetchAfterDelete(transactions.data.length)
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  {TABELS_HEADER_TRANSACTION.map((header) => (
                    <TableHead key={`th-${header}`}>
                      {t(`headers.${header}`)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isLoading &&
                  transactions?.data?.map((transaction, index) => (
                    <TableRow key={`tr-${transaction.id}`}>
                      <TableCell>{(page - 1) * limit + index + 1}</TableCell>
                      <TableCell className="font-medium ">
                        {format.dateTime(new Date(transaction.date), "day")}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        {categoryLabel(transaction.category)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-semibold tabular-nums",
                          transaction.type === "income" && "text-primary-ink",
                        )}
                      >
                        {transaction.type === "income" ? "+" : "−"}
                        {convertToIDR(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <TransactionRowActions
                          transaction={transaction}
                          onUpdated={refetch}
                          onDeleted={() =>
                            refetchAfterDelete(transactions.data.length)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
              {!isLoading && transactions?.data?.length === 0 && (
                <TableCaption>{t("empty")}</TableCaption>
              )}

              {isLoading && <TableCaption>{t("loading")}</TableCaption>}
            </Table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {t("rowsPerPage")}
              </div>
              <Select
                value={limit.toString()}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue placeholder={limit.toString()} />
                </SelectTrigger>
                <SelectContent>
                  {PAGINATIONS_LABEL.map((size) => (
                    <SelectItem key={`limit-${size}`} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {transactions?.totalPages && transactions?.totalPages > 1 && (
              <Pagination className="w-auto mx-0" aria-label={t("pagination")}>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      text={t("previous")}
                      aria-label={t("previousLabel")}
                      onClick={() =>
                        page === 1
                          ? setPage(Number(transactions?.totalPages))
                          : setPage(page - 1)
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      text={t("next")}
                      aria-label={t("nextLabel")}
                      onClick={() =>
                        page === Number(transactions?.totalPages)
                          ? setPage(1)
                          : setPage(page + 1)
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </CardContent>
      </Card>
    </Fragment>
  );
}
