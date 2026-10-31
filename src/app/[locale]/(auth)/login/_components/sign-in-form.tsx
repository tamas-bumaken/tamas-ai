"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { signIn } from "@/actions/auth/actions";
import { isNavigationError } from "@/lib/navigation-error";
import { SignInForm, signInSchema } from "@/validations/auth-validations";
import AuthTextField from "../../_components/auth-text-field";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";

export default function EmailSignInForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  // A successful sign-in redirects from the server action, so only failures come back here.
  const { mutate, isPending } = useMutation({
    mutationFn: (data: SignInForm) => signIn(data, next),
    onSuccess: (result) => {
      if (result?.error) {
        form.setError("root", { type: "server", message: result.error });
      }
    },
    onError: (error) => {
      // The successful sign-in redirect also lands here; the router is already navigating.
      if (isNavigationError(error)) return;

      form.setError("root", {
        type: "server",
        message: t("errors.signInFailed"),
      });
    },
  });

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
          autoComplete="current-password"
        />
        <Link
          href="/forgot-password"
          className="-mt-2 self-end text-sm font-medium text-primary-ink underline-offset-4 hover:underline"
        >
          {t("login.forgotPassword")}
        </Link>
        <FieldError errors={[form.formState.errors.root]} />
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2Icon className="animate-spin" />}
          {isPending ? t("login.submitting") : t("login.submit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
