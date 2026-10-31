import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createTransaction } from "@/actions/transaction/actions";
import {
  TransactionForm,
  transactionFormSchema,
} from "../transaction-validations";
import TransactionFormFields from "./transaction-form-fields";
import { useLoggingFeedback } from "../../_components/logging-feedback";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";

export default function CreateTransactionCard({
  refetch,
}: {
  refetch: () => void;
}) {
  const t = useTranslations("transactions.create");
  const tCommon = useTranslations("common");
  const { formatLoggingInsight } = useLoggingFeedback();
  const form = useForm<TransactionForm>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      amount: "",
      type: "income",
      date: "",
      description: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: TransactionForm) =>
      createTransaction({ ...data, amount: parseFloat(data.amount) }, "manual"),
    onSuccess: ({ insight }) => {
      form.reset();
      refetch();
      toast.success(t("success"), {
        description: insight ? formatLoggingInsight(insight) : undefined,
      });
    },
    // Thrown server messages are hidden in production, so the user gets a readable one.
    onError: () => toast.error(t("failed")),
  });

  const onSubmit = (data: TransactionForm) => {
    mutate(data);
  };

  return (
    <Card className="self-start w-full gap-2">
      <CardHeader className="gap-0">
        <CardTitle className="flex items-center justify-center ">
          {t("title")}
        </CardTitle>
        <CardDescription className="flex items-center justify-center">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-3">
            <TransactionFormFields control={form.control} idPrefix="form" />
            <Button
              type="submit"
              disabled={!form.formState?.isValid || isPending}
            >
              {isPending && <Loader2Icon className="animate-spin" />}
              {isPending ? tCommon("saving") : t("submit")}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
