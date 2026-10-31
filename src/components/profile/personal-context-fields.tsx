import { Control, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { FINANCIAL_GOAL_VALUES } from "@/constans/financial-goals";
import { Profile } from "@/types/profile";
import { PersonalContextForm } from "@/validations/profile-validations";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Shared by onboarding and the profile page.
export default function PersonalContextFields({
  control,
  idPrefix,
}: {
  control: Control<PersonalContextForm>;
  idPrefix: string;
}) {
  const t = useTranslations("personalContext");
  const tGoals = useTranslations("financialGoals");

  return (
    <>
      <Controller
        control={control}
        name="monthly_income"
        render={({ field, fieldState }) => (
          <Field className="gap-1" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-monthly-income`}>
              {t("monthlyIncome")}
            </FieldLabel>
            <Input
              id={`${idPrefix}-monthly-income`}
              {...field}
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={t("monthlyIncomePlaceholder")}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="birth_year"
        render={({ field, fieldState }) => (
          <Field className="gap-1" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-birth-year`}>
              {t("birthYear")}
            </FieldLabel>
            <Input
              id={`${idPrefix}-birth-year`}
              {...field}
              type="number"
              inputMode="numeric"
              placeholder={t("birthYearPlaceholder")}
              autoComplete="bday-year"
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="financial_goal"
        render={({ field, fieldState }) => (
          <Field className="gap-1" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-financial-goal`}>
              {t("financialGoal")}
            </FieldLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger
                id={`${idPrefix}-financial-goal`}
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder={t("financialGoalPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {FINANCIAL_GOAL_VALUES.map((goal) => (
                  <SelectItem key={goal} value={goal}>
                    {tGoals(goal)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="dependents"
        render={({ field, fieldState }) => (
          <Field className="gap-1" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-dependents`}>
              {t("dependents")}
            </FieldLabel>
            <Input
              id={`${idPrefix}-dependents`}
              {...field}
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={t("dependentsPlaceholder")}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="has_debt"
        render={({ field, fieldState }) => (
          <Field className="gap-1" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-has-debt`}>
              {t("hasDebt")}
            </FieldLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger
                id={`${idPrefix}-has-debt`}
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder={t("hasDebtPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">{t("yes")}</SelectItem>
                <SelectItem value="no">{t("no")}</SelectItem>
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </>
  );
}

export function toPersonalContextDefaults(
  profile: Profile,
): PersonalContextForm {
  return {
    monthly_income: profile.monthly_income?.toString() ?? "",
    birth_year: profile.birth_year?.toString() ?? "",
    financial_goal: profile.financial_goal ?? "",
    dependents: profile.dependents?.toString() ?? "",
    has_debt: profile.has_debt === null ? "" : profile.has_debt ? "yes" : "no",
  };
}
