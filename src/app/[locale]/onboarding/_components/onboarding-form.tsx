"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { completeOnboarding, skipOnboarding } from "@/actions/profile/actions";
import { isNavigationError } from "@/lib/navigation-error";
import PersonalContextFields from "@/components/profile/personal-context-fields";
import {
  PersonalContextForm,
  personalContextFormSchema,
} from "@/validations/profile-validations";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

export default function OnboardingForm() {
  const t = useTranslations("onboarding");
  // Consent sits outside the form values so the shared fields keep a single form type.
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  const form = useForm<PersonalContextForm>({
    resolver: zodResolver(personalContextFormSchema),
    defaultValues: {
      monthly_income: "",
      birth_year: "",
      financial_goal: "",
      dependents: "",
      has_debt: "",
    },
  });

  const setServerError = (message: string) =>
    form.setError("root", { type: "server", message });

  // Both actions redirect to the dashboard on success, so only failures come back here.
  const save = useMutation({
    mutationFn: (data: PersonalContextForm) =>
      completeOnboarding({ ...data, consent }),
    onSuccess: (result) => {
      if (result && "error" in result) setServerError(result.error);
    },
    // The redirect to the dashboard also lands here; the router is already navigating.
    onError: (error) => {
      if (isNavigationError(error)) return;
      setServerError(t("saveFailed"));
    },
  });

  const skip = useMutation({
    mutationFn: () => skipOnboarding(),
    onSuccess: (result) => {
      if (result && "error" in result) setServerError(result.error);
    },
    onError: (error) => {
      if (isNavigationError(error)) return;
      setServerError(t("genericError"));
    },
  });

  const isPending = save.isPending || skip.isPending;

  function onSubmit(data: PersonalContextForm) {
    if (!consent) {
      setConsentError("consentRequired");
      return;
    }

    save.mutate(data);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-4">
        <PersonalContextFields control={form.control} idPrefix="onboarding" />
        <Field
          orientation="horizontal"
          className="items-start gap-2"
          data-invalid={Boolean(consentError)}
        >
          <Checkbox
            id="onboarding-consent"
            checked={consent}
            onCheckedChange={(checked) => {
              setConsent(checked === true);
              setConsentError(null);
            }}
            aria-invalid={Boolean(consentError)}
            aria-describedby={
              consentError ? "onboarding-consent-error" : undefined
            }
            className="mt-0.5"
          />
          <FieldLabel
            htmlFor="onboarding-consent"
            className="font-normal leading-snug text-muted-foreground"
          >
            {t("consent")}
          </FieldLabel>
        </Field>
        <FieldError
          id="onboarding-consent-error"
          errors={consentError ? [{ message: consentError }] : undefined}
        />
        <FieldError errors={[form.formState.errors.root]} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => skip.mutate()}
          >
            {skip.isPending && <Loader2Icon className="animate-spin" />}
            {t("skip")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {save.isPending && <Loader2Icon className="animate-spin" />}
            {save.isPending ? t("submitting") : t("submit")}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
