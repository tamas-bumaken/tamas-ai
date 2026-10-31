"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { requestPasswordReset } from "@/actions/auth/actions";
import {
  ForgotPasswordForm as ForgotPasswordFormValues,
  forgotPasswordSchema,
} from "@/validations/auth-validations";
import AuthTextField from "../../_components/auth-text-field";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";

export default function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const { mutate, isPending, data } = useMutation({
    mutationFn: (values: ForgotPasswordFormValues) =>
      requestPasswordReset(values),
    onSuccess: (result) => {
      if ("error" in result) {
        form.setError("root", { type: "server", message: result.error });
      }
    },
    onError: () => {
      form.setError("root", {
        type: "server",
        message: t("errors.resetEmailFailed"),
      });
    },
  });

  if (data && "sent" in data) {
    return (
      <p role="status" className="text-sm leading-6">
        {t("forgotPassword.sent")}
      </p>
    );
  }

  return (
    <form onSubmit={form.handleSubmit((values) => mutate(values))} noValidate>
      <FieldGroup className="gap-4">
        <AuthTextField
          control={form.control}
          name="email"
          label={t("fields.email")}
          type="email"
          autoComplete="email"
        />
        <FieldError errors={[form.formState.errors.root]} />
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2Icon className="animate-spin" />}
          {isPending
            ? t("forgotPassword.submitting")
            : t("forgotPassword.submit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
