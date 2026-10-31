"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updatePassword } from "@/actions/auth/actions";
import {
  ResetPasswordForm as ResetPasswordFormValues,
  resetPasswordSchema,
} from "@/validations/auth-validations";
import AuthTextField from "../../_components/auth-text-field";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";

export default function ResetPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: ResetPasswordFormValues) => updatePassword(values),
    onSuccess: (result) => {
      if ("error" in result) {
        form.setError("root", { type: "server", message: result.error });
        return;
      }

      toast.success(t("resetPassword.updated"));
      router.replace("/dashboard");
    },
    onError: () => {
      form.setError("root", {
        type: "server",
        message: t("errors.updatePasswordFailed"),
      });
    },
  });

  return (
    <form onSubmit={form.handleSubmit((values) => mutate(values))} noValidate>
      <FieldGroup className="gap-4">
        <AuthTextField
          control={form.control}
          name="password"
          label={t("fields.newPassword")}
          type="password"
          autoComplete="new-password"
        />
        <AuthTextField
          control={form.control}
          name="confirmPassword"
          label={t("fields.confirmNewPassword")}
          type="password"
          autoComplete="new-password"
        />
        <FieldError errors={[form.formState.errors.root]} />
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2Icon className="animate-spin" />}
          {isPending
            ? t("resetPassword.submitting")
            : t("resetPassword.submit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
