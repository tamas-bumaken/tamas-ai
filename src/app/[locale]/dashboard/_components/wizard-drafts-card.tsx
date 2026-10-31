"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PencilIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { useFormatter, useTranslations } from "next-intl";
import { useCategoryLabel } from "@/hooks/use-category-label";
import { createTransactions } from "@/actions/transaction/actions";
import { cn, convertToIDR } from "@/lib/utils";
import { WizardDraft } from "./wizard-draft";
import WizardCreatedSummary from "./wizard-created-summary";
import { useLoggingFeedback } from "./logging-feedback";
import { Button } from "@/components/ui/button";

const TOAST_BASE_DURATION_MS = 4000;
const TOAST_MS_PER_ROW = 1500;

// The review step of quick entry (Phase 1 / 1.1): nothing is stored until the user presses Save.
export default function WizardDraftsCard({
  drafts,
  onEdit,
  onRemove,
  onClear,
  onSaved,
}: {
  drafts: WizardDraft[];
  onEdit: (key: string) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
  onSaved?: () => void;
}) {
  const t = useTranslations("wizard.drafts");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const categoryLabel = useCategoryLabel();
  const { formatLoggingInsight } = useLoggingFeedback();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createTransactions(
        drafts.map(({ payload, edited }) => ({
          payload,
          editedInPreview: edited,
        })),
      ),
    onSuccess: ({ insight }) => {
      const saved = drafts.map(({ payload }) => payload);
      toast.success(t("logged", { count: saved.length }), {
        description: (
          <>
            <WizardCreatedSummary created={saved} />
            {insight && (
              <p className="pt-1.5 border-t text-foreground">
                {formatLoggingInsight(insight)}
              </p>
            )}
          </>
        ),
        // Longer lists need more time to read before the toast closes.
        duration: TOAST_BASE_DURATION_MS + saved.length * TOAST_MS_PER_ROW,
      });
      onClear();
      onSaved?.();
      // Prefix match refreshes both the recent list and the paginated table.
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
    // The drafts are saved in one insert, so on failure nothing was stored and they stay here to retry.
    onError: () => {
      toast.error(t("saveFailed"));
    },
  });

  return (
    <section
      aria-labelledby="wizard-drafts-title"
      className="px-(--card-spacing) pt-3 pb-4 border-t"
    >
      <h2 id="wizard-drafts-title" className="font-medium">
        {t("title")}
      </h2>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <ul className="mt-2 divide-y">
        {drafts.map(({ key, payload }) => {
          const name = payload.description || categoryLabel(payload.category);

          return (
            <li
              key={key}
              className="flex items-center justify-between gap-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate">{name}</p>
                <p className="text-xs truncate text-muted-foreground">
                  {categoryLabel(payload.category)} ·{" "}
                  {format.dateTime(new Date(payload.date), "day")}
                </p>
              </div>
              <div className="flex items-center shrink-0 gap-1">
                <p
                  className={cn(
                    "mr-1 font-medium tabular-nums",
                    payload.type === "income" && "text-primary-ink",
                  )}
                >
                  {payload.type === "income" ? "+" : "−"}
                  {convertToIDR(payload.amount)}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => onEdit(key)}
                  aria-label={t("edit", { name })}
                  className="max-sm:size-11"
                >
                  <PencilIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => onRemove(key)}
                  aria-label={t("remove", { name })}
                  className="max-sm:size-11"
                >
                  <XIcon />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap justify-end gap-2 mt-3">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={onClear}
        >
          {t("discard")}
        </Button>
        <Button type="button" disabled={isPending} onClick={() => mutate()}>
          {isPending && <Loader2Icon className="animate-spin" />}
          {isPending ? tCommon("saving") : t("save", { count: drafts.length })}
        </Button>
      </div>
    </section>
  );
}
