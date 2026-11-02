"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LightbulbIcon, ArrowRightIcon, MessageCircleIcon } from "lucide-react";
import { getAISuggestion } from "@/actions/advisor/ai-suggestion";
import { useAdvisorDrawer } from "./advisor-drawer-context";

export type AISuggestion = {
  title: string;
  explanation: string;
  actionLabel: string;
  actionMessage: string;
};

// One AI suggestion per view, placed right below the quick entry. Figures come from
// the user's own records via Gemini, so the suggestion references real business numbers.
export default function AISuggestionCard() {
  const t = useTranslations("dashboard.aiSuggestion");
  const advisor = useAdvisorDrawer();
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const result = await getAISuggestion();
      if (!mounted) return;
      if ("suggestion" in result) {
        setSuggestion(result.suggestion);
      } else if ("noData" in result) {
        setSuggestion(null);
      } else {
        setHasError(true);
      }
      setIsLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Nothing to suggest yet (no transactions recorded this month).
  if (!isLoading && !suggestion && !hasError) return null;

  function openAdvisor(message: string) {
    advisor.setPendingMessage(message);
    advisor.setIsOpen(true);
  }

  // Loading state.
  if (isLoading) {
    return (
      <Card className="gap-4 border-primary/20" aria-label={t("heading")}>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
            <LightbulbIcon className="size-5" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-sm font-medium leading-tight">
              {t("heading")}
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs leading-tight text-muted-foreground">
              {t("subtitle")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state.
  if (hasError) {
    return (
      <Card className="gap-4 border-primary/20" aria-label={t("heading")}>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
            <LightbulbIcon className="size-5" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-sm font-medium leading-tight">
              {t("heading")}
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs leading-tight text-muted-foreground">
              {t("subtitle")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {t("failed")}
          </div>
        </CardContent>
      </Card>
    );
  }

  // suggestion is guaranteed non-null here.
  if (!suggestion) return null;

  return (
    <Card className="gap-4 border-primary/20" aria-label={t("heading")}>
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
          <LightbulbIcon className="size-5" aria-hidden />
        </div>
        <div>
          <CardTitle className="text-sm font-medium leading-tight">
            {t("heading")}
          </CardTitle>
          <CardDescription className="mt-0.5 text-xs leading-tight text-muted-foreground">
            {t("subtitle")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="text-base font-medium leading-snug">
          {suggestion.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {suggestion.explanation}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Button
          onClick={() => openAdvisor(suggestion.actionMessage)}
          variant="default"
          className="text-sm">
          {suggestion.actionLabel}
          <ArrowRightIcon className="ml-1.5 size-4" aria-hidden />
        </Button>
        <Button
          onClick={() => openAdvisor(t("askMoreMessage"))}
          variant="ghost"
          className="text-sm">
          <MessageCircleIcon className="mr-1.5 size-4" aria-hidden />
          {t("askMore")}
        </Button>
      </CardFooter>
    </Card>
  );
}
