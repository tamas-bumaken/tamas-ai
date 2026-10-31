"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { deleteAccount } from "@/actions/profile/actions";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/validations/profile-validations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function DeleteAccountDialog() {
  const t = useTranslations("profile.deleteAccount");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteAccount({ confirmation }),
    onSuccess: (result) => {
      if ("error" in result) {
        setServerError(result.error);
        return;
      }

      toast.success(t("deleted"));
      router.replace("/");
    },
    onError: () => setServerError(t("failed")),
  });

  const isConfirmed = confirmation === DELETE_ACCOUNT_CONFIRMATION;

  return (
    <Dialog
      onOpenChange={(open) => {
        // Starts fresh each time, so a half-typed confirmation never carries over.
        if (!open) {
          setConfirmation("");
          setServerError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive">{t("button")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>
        <form
          id="delete-account-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (isConfirmed && !isPending) mutate();
          }}
        >
          <Field className="gap-1" data-invalid={Boolean(serverError)}>
            <FieldLabel htmlFor="delete-account-confirmation">
              {t("confirmLabel", { word: DELETE_ACCOUNT_CONFIRMATION })}
            </FieldLabel>
            <Input
              id="delete-account-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={isPending}
            />
            <FieldError>{serverError}</FieldError>
          </Field>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              {tCommon("cancel")}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="delete-account-form"
            variant="destructive"
            disabled={!isConfirmed || isPending}
          >
            {isPending && <Loader2Icon className="animate-spin" />}
            {isPending ? tCommon("deleting") : t("button")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
