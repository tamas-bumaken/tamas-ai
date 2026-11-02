import "server-only";

import { ApiError, GenerateContentResponseUsageMetadata } from "@google/genai";
import z from "zod";
import { getCookieTranslations } from "@/i18n/server";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type AiEndpoint = "chat" | "wizard" | "suggestion";

// Starting limits per user (Phase 0 / 0.5). Quick entry is looser: logging must never feel rationed,
// the cap only stops abuse. Days reset at midnight in Jakarta. The daily message is a key of "apiErrors".
const AI_LIMITS: Record<
  AiEndpoint,
  {
    perMinute: number;
    daily: number;
    dailyMessage: "dailyChat" | "dailyWizard" | "dailySuggestion";
  }
> = {
  chat: { perMinute: 5, daily: 30, dailyMessage: "dailyChat" },
  wizard: { perMinute: 10, daily: 100, dailyMessage: "dailyWizard" },
  // Only spent when the figures changed since the stored suggestion, and nobody asked for it, so the cap is low.
  suggestion: { perMinute: 3, daily: 10, dailyMessage: "dailySuggestion" },
};

const startResultSchema = z.object({
  request_id: z.uuid().nullable(),
  rejected_reason: z.enum(["rate_limit", "daily_quota"]).nullable(),
});

export type AiRequestStart =
  | { allowed: true; requestId: string }
  | { allowed: false; status: 429 | 500; message: string };

// Checks the limits and records the request in one atomic call, before any Gemini call is made.
// The client must carry the user's session: the SQL function reads the user from auth.uid().
// Fails closed: when the check itself fails, no Gemini call is made, so spending stays bounded.
export async function startAiRequest(
  supabase: SupabaseClient,
  endpoint: AiEndpoint,
  model: string,
): Promise<AiRequestStart> {
  const limits = AI_LIMITS[endpoint];
  // Route handlers call this, so the message follows the language cookie.
  const t = await getCookieTranslations("apiErrors");
  const { data, error } = await supabase
    .rpc("start_ai_request", {
      p_endpoint: endpoint,
      p_model: model,
      p_per_minute_limit: limits.perMinute,
      p_daily_limit: limits.daily,
    })
    .single();
  const result = startResultSchema.safeParse(data);

  if (error || !result.success) {
    console.error(
      "[ai-usage] quota check failed",
      endpoint,
      error ?? result.error,
    );
    return {
      allowed: false,
      status: 500,
      message: t("quotaCheckFailed"),
    };
  }

  const { request_id, rejected_reason } = result.data;

  if (rejected_reason === "rate_limit") {
    return { allowed: false, status: 429, message: t("rateLimit") };
  }
  if (rejected_reason === "daily_quota" || !request_id) {
    return {
      allowed: false,
      status: 429,
      message: t(limits.dailyMessage, { limit: limits.daily }),
    };
  }

  return { allowed: true, requestId: request_id };
}

export type AiUsageTotals = {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
};

export function createUsageTotals(): AiUsageTotals {
  return { inputTokens: 0, outputTokens: 0, thinkingTokens: 0 };
}

// Called once per Gemini call; a request with tool rounds makes several.
export function addUsage(
  totals: AiUsageTotals,
  usage: GenerateContentResponseUsageMetadata | undefined,
): void {
  if (!usage) return;

  totals.inputTokens +=
    (usage.promptTokenCount ?? 0) + (usage.toolUsePromptTokenCount ?? 0);
  totals.outputTokens += usage.candidatesTokenCount ?? 0;
  totals.thinkingTokens += usage.thoughtsTokenCount ?? 0;
}

// Never throws: the user already has their answer, so a failed write is logged instead of surfacing as an error.
export async function finishAiRequest(
  supabase: SupabaseClient,
  requestId: string,
  totals: AiUsageTotals,
): Promise<void> {
  const { error } = await supabase.rpc("finish_ai_request", {
    p_request_id: requestId,
    p_input_tokens: totals.inputTokens,
    p_output_tokens: totals.outputTokens,
    p_thinking_tokens: totals.thinkingTokens,
  });

  if (error) {
    console.error("[ai-usage] failed to record token usage", requestId, error);
  }
}

// 429 means the app's own Gemini quota is spent and 503 that the model is overloaded; neither is the user's fault.
export function isAiServiceBusy(error: unknown): boolean {
  return (
    error instanceof ApiError && (error.status === 429 || error.status === 503)
  );
}
