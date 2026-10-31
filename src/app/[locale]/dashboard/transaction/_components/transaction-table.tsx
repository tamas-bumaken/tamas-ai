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
                    <TableCell>{categoryLabel(transaction.category)}</TableCell>
                    <TableCell
                      className={cn(
                        "font-semibold",
                        transaction.type === "expense"
                          ? "text-destructive"
                          : "text-primary-ink",
                      )}
                    >
                      {transaction.type === "expense" && "-"}
                      {convertToIDR(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <TransactionRowActions
                        transaction={transaction}
                        onUpdated={refetch}
                        onDeleted={() => {
                          // Deleting the only row of a later page would leave an empty page.
                          if (transactions.data.length === 1 && page > 1) {
                            setPage(page - 1);
                          } else {
                            refetch();
                          }
                        }}
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
