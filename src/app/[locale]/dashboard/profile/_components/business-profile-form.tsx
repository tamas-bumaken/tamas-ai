"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { updateBusinessProfile } from "@/actions/profile/actions";
import BusinessProfileFields, {
  toBusinessProfileDefaults,
} from "@/components/profile/business-profile-fields";
import { Profile } from "@/types/profile";
import {
  BusinessProfileForm,
  businessProfileFormSchema,
} from "@/validations/profile-validations";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";

export default function BusinessProfileCardForm({
  profile,
}: {
  profile: Profile;
}) {
  const t = useTranslations("profile.businessProfile");
  const tCommon = useTranslations("common");
  const form = useForm<BusinessProfileForm>({
    resolver: zodResolver(businessProfileFormSchema),
    defaultValues: toBusinessProfileDefaults(profile),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: BusinessProfileForm) => updateBusinessProfile(data),
    onSuccess: (result, data) => {
      if ("error" in result) {
        form.setError("root", { type: "server", message: result.error });
        return;
      }

      form.reset(data);
      toast.success(t("updated"));
    },
    onError: () => {
      form.setError("root", {
        type: "server",
        message: t("saveFailed"),
      });
    },
  });

  return (
    <form onSubmit={form.handleSubmit((data) => mutate(data))} noValidate>
      <FieldGroup className="gap-4">
        <BusinessProfileFields control={form.control} idPrefix="profile" />
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
