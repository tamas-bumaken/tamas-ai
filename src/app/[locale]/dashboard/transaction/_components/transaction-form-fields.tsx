import { Control, Controller, useController, useWatch } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { useTranslations } from "next-intl";
import { useCategoryLabel } from "@/hooks/use-category-label";
import { useDateFnsLocale } from "@/hooks/use-date-fns-locale";
import { TransactionForm } from "../transaction-validations";
import {
  CATEGORIES_BY_TYPE,
  isCategoryOfType,
} from "@/constans/transaction-categories";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function TransactionFormFields({
  control,
  idPrefix,
}: {
  control: Control<TransactionForm>;
  // The create and update forms can be mounted at the same time, so their field ids must differ.
  idPrefix: string;
}) {
  const t = useTranslations("transactions.fields");
  const tCommon = useTranslations("common");
  const categoryLabel = useCategoryLabel();
  const dateFnsLocale = useDateFnsLocale();
  const type = useWatch({ control, name: "type" });
  const { field: categoryField, fieldState: categoryState } = useController({
    control,
    name: "category",
  });

  return (
    <>
      <Controller
        control={control}
        name="amount"
        render={({ field, fieldState }) => (
          <Field className="gap-1">
            <FieldLabel htmlFor={`${idPrefix}-amount`}>
              {t("amount")}
            </FieldLabel>
            <Input
              id={`${idPrefix}-amount`}
              {...field}
              placeholder={t("amountPlaceholder")}
              autoCapitalize="off"
              type="number"
              aria-invalid={fieldState.invalid}
            />
            {fieldState && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={control}
        name="type"
        render={({ field, fieldState }) => (
          <Field className="gap-1">
            <FieldLabel htmlFor={`${idPrefix}-type`}>{t("type")}</FieldLabel>
            <Select
              onValueChange={(value: TransactionForm["type"]) => {
                field.onChange(value);
                // A category picked for the other type would otherwise stay selected but hidden.
                if (
                  categoryField.value &&
                  !isCategoryOfType(categoryField.value, value)
                ) {
                  categoryField.onChange(undefined);
                }
              }}
              value={field.value}
            >
              <SelectTrigger
                id={`${idPrefix}-type`}
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder={t("typePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">{tCommon("income")}</SelectItem>
                <SelectItem value="expense">{tCommon("expense")}</SelectItem>
              </SelectContent>
            </Select>
            {fieldState && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Field className="gap-1">
        <FieldLabel htmlFor={`${idPrefix}-category`}>
          {t("category")}
        </FieldLabel>
        {/* An empty string shows the placeholder; undefined would make the Select uncontrolled and keep the old label. */}
        <Select
          onValueChange={categoryField.onChange}
          value={categoryField.value ?? ""}
        >
          <SelectTrigger
            id={`${idPrefix}-category`}
            onBlur={categoryField.onBlur}
            aria-invalid={categoryState.invalid}
          >
            <SelectValue placeholder={t("categoryPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES_BY_TYPE[type].map((category) => (
              <SelectItem key={category} value={category}>
                {categoryLabel(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError errors={[categoryState.error]} />
      </Field>
      <Controller
        control={control}
        name="date"
        render={({ field, fieldState }) => (
          <Field className="gap-1">
            <FieldLabel htmlFor={`${idPrefix}-date`}>{t("date")}</FieldLabel>
            <DatePicker
              id={`${idPrefix}-date`}
              value={field.value ? parseISO(field.value) : undefined}
              onChange={(date) =>
                field.onChange(date ? format(date, "yyyy-MM-dd") : "")
              }
              onBlur={field.onBlur}
              locale={dateFnsLocale}
              placeholder={t("datePlaceholder")}
              aria-invalid={fieldState.invalid}
            />
            {fieldState && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field, fieldState }) => (
          <Field className="gap-1">
            <FieldLabel htmlFor={`${idPrefix}-description`}>
              {t("description")}
            </FieldLabel>
            <Textarea
              id={`${idPrefix}-description`}
              {...field}
              placeholder={t("descriptionPlaceholder")}
              aria-invalid={fieldState.invalid}
            />
            {fieldState && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </>
  );
}
