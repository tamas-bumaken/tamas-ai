import { Control, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  BUSINESS_TYPE_VALUES,
  REGENCY_VALUES,
  TOURIST_DEPENDENCE_VALUES,
} from "@/constans/business-profile";
import { Profile } from "@/types/profile";
import { BusinessProfileForm } from "@/validations/profile-validations";
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
export default function BusinessProfileFields({
  control,
  idPrefix,
}: {
  control: Control<BusinessProfileForm>;
  idPrefix: string;
}) {
  const t = useTranslations("businessProfile");

  return (
    <>
      <Controller
        control={control}
        name="business_name"
        render={({ field, fieldState }) => (
          <Field className="gap-1" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-business-name`}>
              {t("name")}
            </FieldLabel>
            <Input
              id={`${idPrefix}-business-name`}
              {...field}
              placeholder={t("namePlaceholder")}
              autoComplete="organization"
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="business_type"
        render={({ field, fieldState }) => (
          <Field className="gap-1" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-business-type`}>
              {t("type")}
            </FieldLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger
                id={`${idPrefix}-business-type`}
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder={t("typePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPE_VALUES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`types.${type}`)}
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
        name="regency"
        render={({ field, fieldState }) => (
          <Field className="gap-1" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-regency`}>
              {t("regency")}
            </FieldLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger
                id={`${idPrefix}-regency`}
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder={t("regencyPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {REGENCY_VALUES.map((regency) => (
                  <SelectItem key={regency} value={regency}>
                    {t(`regencies.${regency}`)}
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
        name="tourist_dependence"
        render={({ field, fieldState }) => (
          <Field className="gap-1" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-tourist-dependence`}>
              {t("touristDependence")}
            </FieldLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger
                id={`${idPrefix}-tourist-dependence`}
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder={t("touristDependencePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {TOURIST_DEPENDENCE_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`touristDependenceOptions.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </>
  );
}

export function toBusinessProfileDefaults(
  profile: Profile,
): BusinessProfileForm {
  return {
    business_name: profile.business_name ?? "",
    business_type: profile.business_type ?? "",
    regency: profile.regency ?? "",
    tourist_dependence: profile.tourist_dependence ?? "",
  };
}
