"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/actions/profile/actions";
import {
  ProfileForm,
  profileFormSchema,
} from "@/validations/profile-validations";
import { Profile } from "@/types/profile";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function ProfileDetailsForm({ profile }: { profile: Profile }) {
  const t = useTranslations("profile.account");
  const tCommon = useTranslations("common");
  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: profile.username,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ProfileForm) => updateProfile(data),
    onSuccess: (result, data) => {
      if ("error" in result) {
        form.setError("root", { type: "server", message: result.error });
        return;
      }

      // Re-baseline the form so isDirty reflects the saved values.
      form.reset(data);
      toast.success(t("updated"));
    },
    onError: () => {
      form.setError("root", {
        type: "server",
        message: t("updateFailed"),
      });
    },
  });

  return (
    <form onSubmit={form.handleSubmit((data) => mutate(data))} noValidate>
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="username"
          render={({ field, fieldState }) => (
            <Field className="gap-1" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profile-username">
                {t("username")}
              </FieldLabel>
              <Input
                id="profile-username"
                {...field}
                autoComplete="username"
                autoCapitalize="off"
                spellCheck={false}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <FieldError errors={[form.formState.errors.root]} />
        <Button
          type="submit"
          className="self-start"
          disabled={isPending || !form.formState.isDirty}
        >
          {isPending && <Loader2Icon className="animate-spin" />}
          {isPending ? tCommon("saving") : t("submit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
