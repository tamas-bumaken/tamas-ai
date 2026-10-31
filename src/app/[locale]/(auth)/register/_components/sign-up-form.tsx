"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon, MailCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { signUp } from "@/actions/auth/actions";
import { isNavigationError } from "@/lib/navigation-error";
import { SignUpForm, signUpSchema } from "@/validations/auth-validations";
import AuthTextField from "../../_components/auth-text-field";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";

export default function EmailSignUpForm() {
  const t = useTranslations("auth");
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(
    null,
  );

  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: SignUpForm) => signUp(data),
    // Without email confirmation the server action redirects instead, and there is no result.
    onSuccess: (result, data) => {
      if (!result) return;

      if ("error" in result) {
        form.setError("root", { type: "server", message: result.error });
        return;
      }

      setConfirmationEmail(data.email);
    },
    onError: (error) => {
      // The redirect to onboarding also lands here; the router is already navigating.
      if (isNavigationError(error)) return;

      form.setError("root", {
        type: "server",
        message: t("errors.signUpFailed"),
      });
    },
  });

  if (confirmationEmail) {
    return (
      <div
        role="status"
        className="flex flex-col items-center text-center gap-3"
      >
        <MailCheckIcon
          className="size-10 text-primary-ink"
          aria-hidden="true"
        />
        <p className="font-medium">{t("register.checkEmailTitle")}</p>
        <p className="text-sm text-muted-foreground">
          {t.rich("register.checkEmailBody", {
            email: confirmationEmail,
            strong: (chunks) => (
              <span className="font-medium text-foreground">{chunks}</span>
            ),
          })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit((data) => mutate(data))} noValidate>
      <FieldGroup className="gap-4">
        <AuthTextField
          control={form.control}
          name="email"
          label={t("fields.email")}
          type="email"
          autoComplete="email"
        />
        <AuthTextField
          control={form.control}
          name="password"
          label={t("fields.password")}
          type="password"
          autoComplete="new-password"
        />
        <AuthTextField
          control={form.control}
          name="confirmPassword"
          label={t("fields.confirmPassword")}
          type="password"
          autoComplete="new-password"
        />
        <FieldError errors={[form.formState.errors.root]} />
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2Icon className="animate-spin" />}
          {isPending ? t("register.submitting") : t("register.submit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
