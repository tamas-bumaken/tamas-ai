"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { setAdvisorUsesPersonalData } from "@/actions/advisor/actions";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";

// Replaces the Personal/General picker in the Advisor drawer (Phase 1 / 1.9). Saved as soon as it is toggled.
export default function AdvisorDataSetting({
  enabled: initialEnabled,
}: {
  enabled: boolean;
}) {
  const t = useTranslations("profile.advisorData");
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(initialEnabled);

  const { mutate, isPending } = useMutation({
    mutationFn: setAdvisorUsesPersonalData,
    onMutate: (next) => setEnabled(next),
    onSuccess: (result, next) => {
      if ("error" in result) {
        setEnabled(!next);
        toast.error(result.error);
        return;
      }
      // The drawer's suggestions and privacy note follow the setting.
      queryClient.invalidateQueries({ queryKey: ["advisor-mode"] });
      toast.success(next ? t("enabled") : t("disabled"));
    },
    onError: (_error, next) => {
      setEnabled(!next);
      toast.error(t("saveFailed"));
    },
  });

  return (
    <Field orientation="horizontal" className="items-start gap-3">
      <Checkbox
        id="advisor-uses-personal-data"
        checked={enabled}
        disabled={isPending}
        onCheckedChange={(checked) => mutate(checked === true)}
        className="mt-0.5"
      />
      <FieldContent>
        <FieldLabel htmlFor="advisor-uses-personal-data">
          {t("label")}
        </FieldLabel>
        <FieldDescription>{t("help")}</FieldDescription>
      </FieldContent>
    </Field>
  );
}
