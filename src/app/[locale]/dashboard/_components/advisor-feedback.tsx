"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { sendAdvisorFeedback } from "@/actions/advisor/actions";
import {
  ADVISOR_FEEDBACK_REASONS,
  AdvisorFeedback as AdvisorFeedbackInput,
  ChatMode,
} from "@/validations/chatbot-validations";
import { Button } from "@/components/ui/button";

// Rates one advisor answer (Phase 1 / 1.10). A thumbs down asks for an optional preset reason.
export default function AdvisorFeedback({ mode }: { mode: ChatMode }) {
  const t = useTranslations("advisor.feedback");
  const [step, setStep] = useState<"rate" | "reason" | "done">("rate");

  const { mutate, isPending, isError } = useMutation({
    mutationFn: async (feedback: AdvisorFeedbackInput) => {
      const result = await sendAdvisorFeedback(feedback);
      if ("error" in result) throw new Error(result.error);
    },
    onSuccess: () => setStep("done"),
  });

  if (step === "done") {
    return (
      <p
        role="status"
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <CheckIcon aria-hidden="true" className="size-3.5 text-primary-ink" />
        {t("thanks")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {step === "rate" ? (
        <div
          role="group"
          aria-label={t("rateLabel")}
          className="flex items-center gap-1 text-xs text-muted-foreground"
        >
          <span className="mr-1">{t("question")}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isPending}
            onClick={() => mutate({ rating: "up", mode })}
            aria-label={t("helpful")}
            className="max-sm:size-9"
          >
            <ThumbsUpIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isPending}
            onClick={() => setStep("reason")}
            aria-label={t("notHelpful")}
            className="max-sm:size-9"
          >
            <ThumbsDownIcon />
          </Button>
        </div>
      ) : (
        <div
          role="group"
          aria-label={t("whatWentWrong")}
          className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span className="mr-0.5">{t("whatWentWrong")}</span>
          {ADVISOR_FEEDBACK_REASONS.map((reason) => (
            <Button
              key={reason}
              type="button"
              variant="outline"
              size="xs"
              disabled={isPending}
              onClick={() => mutate({ rating: "down", reason, mode })}
            >
              {t(`reasons.${reason}`)}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={isPending}
            onClick={() => mutate({ rating: "down", mode })}
          >
            {t("skip")}
          </Button>
        </div>
      )}
      {isError && (
        <p role="alert" className="text-xs text-destructive">
          {t("failed")}
        </p>
      )}
    </div>
  );
}
