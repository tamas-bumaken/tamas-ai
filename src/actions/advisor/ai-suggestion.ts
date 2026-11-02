"use server";

import { createHash } from "node:crypto";
import { ThinkingLevel } from "@google/genai";
import { getMonthlySummary } from "@/actions/transaction/actions";
import { isTransactionCategory } from "@/constans/transaction-categories";
import { Locale } from "@/i18n/routing";
import { getCookieLocale, getCookieTranslations } from "@/i18n/server";
import { loadAdvisorMode } from "@/lib/advisor-settings";
import {
  addUsage,
  createUsageTotals,
  finishAiRequest,
  startAiRequest,
} from "@/lib/ai-usage";
import { getCurrentProfile, requireUserId } from "@/lib/auth";
import { ai } from "@/lib/genai";
import { createClient } from "@/lib/supabase/server";
import {
  AISuggestion,
  aiSuggestionSchema,
} from "@/validations/ai-suggestion-validations";

const SUGGESTION_MODEL = "gemini-3-flash-preview";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type SuggestionResult =
  | { suggestion: AISuggestion }
  | { error: string }
  | { noData: true };

const LANGUAGE_RULES: Record<Locale, string> = {
  id: 'Write in Bahasa Indonesia, in everyday words with no accounting terms. Example button labels: "Catat belanja", "Lihat laba", "Tetapkan batas ambilan".',
  en: 'Write in English, in everyday words with no accounting terms. Example button labels: "Log a purchase", "See profit", "Set a withdrawal limit".',
};

function buildPrompt(locale: Locale, snapshot: Record<string, unknown>) {
  return `
You are the AI Advisor in TAMAS. Write ONE specific action for the owner of a micro-business in Bali, based on their real figures below. Never make up a figure: use only the ones given, and mention at least one so it is clear the suggestion comes from their data and is not general advice.

The owner's figures (in rupiah):
${JSON.stringify(snapshot, null, 2)}

Rules:
- ${LANGUAGE_RULES[locale]}
- "title": at most 6 words.
- "explanation": exactly 2 sentences.
- "actionLabel": a short button label.
- "actionMessage": one question the owner could send to the AI Advisor to discuss this further, mentioning their figures.

Output ONLY valid JSON, with no other text:
{
  "title": "...",
  "explanation": "...",
  "actionLabel": "...",
  "actionMessage": "..."
}
`.trim();
}

// The figures carry the period's end date, so a suggestion lasts one day at most, and any new or changed
// transaction, profile change or language switch gives a different fingerprint.
function getFingerprint(locale: Locale, snapshot: Record<string, unknown>) {
  return createHash("sha256")
    .update(JSON.stringify({ locale, snapshot }))
    .digest("hex");
}

// A cache failure only costs a Gemini call, so it is logged and treated as a miss. RLS limits this to the caller's row.
async function loadStoredSuggestion(
  supabase: SupabaseClient,
  fingerprint: string,
): Promise<AISuggestion | null> {
  const { data, error } = await supabase
    .from("ai_suggestions")
    .select("fingerprint, suggestion")
    .maybeSingle();

  if (error) {
    console.error("[ai-suggestion] cache read failed", error);
    return null;
  }
  if (data?.fingerprint !== fingerprint) return null;

  const stored = aiSuggestionSchema.safeParse(data.suggestion);
  return stored.success ? stored.data : null;
}

async function storeSuggestion(
  supabase: SupabaseClient,
  fingerprint: string,
  suggestion: AISuggestion,
) {
  const { error } = await supabase
    .from("ai_suggestions")
    .upsert(
      { fingerprint, suggestion, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) console.error("[ai-suggestion] cache write failed", error);
}

// One concrete suggestion from the user's own figures. It reads their data, so it follows the Advisor's mode: in
// General mode, or when the mode cannot be read, nothing is read and nothing is sent to Gemini.
export async function getAISuggestion(): Promise<SuggestionResult> {
  const userId = await requireUserId();
  const supabase = await createClient();

  const mode = await loadAdvisorMode(supabase, userId).catch((error) => {
    console.error("[ai-suggestion] advisor setting lookup failed", error);
    return "general" as const;
  });
  if (mode !== "personal") return { noData: true };

  const [profile, summary, locale] = await Promise.all([
    getCurrentProfile(),
    getMonthlySummary(),
    getCookieLocale(),
  ]);
  const { current } = summary;

  // No business activity yet: nothing meaningful to derive from real data.
  if (current.businessIncome === 0 && current.businessExpense === 0) {
    return { noData: true };
  }

  const [t, tCategories, tBusinessProfile] = await Promise.all([
    getCookieTranslations("dashboard.aiSuggestion"),
    getCookieTranslations("categories"),
    getCookieTranslations("businessProfile"),
  ]);
  const topCost = summary.spendingByCategory[0];

  // In the user's language, so the model does not repeat a stored English category name in the suggestion.
  const snapshot = {
    businessName: profile.business_name,
    businessType: profile.business_type
      ? tBusinessProfile(`types.${profile.business_type}`)
      : null,
    period: `${current.startDate} / ${current.endDate}`,
    businessIncome: current.businessIncome,
    businessExpense: current.businessExpense,
    profit: current.profit,
    profitMarginPercent: current.profitMarginPercent,
    cashLeft: current.cashLeft,
    ownerTaken: current.ownerTaken,
    ownerWithdrawals: current.ownerWithdrawals,
    ceremony: current.ceremony,
    topCostCategory: topCost
      ? isTransactionCategory(topCost.category)
        ? tCategories(topCost.category)
        : topCost.category
      : null,
    topCostAmount: topCost?.total ?? 0,
  };

  const fingerprint = getFingerprint(locale, snapshot);
  const stored = await loadStoredSuggestion(supabase, fingerprint);
  if (stored) return { suggestion: stored };

  const quota = await startAiRequest(supabase, "suggestion", SUGGESTION_MODEL);
  if (!quota.allowed) return { error: quota.message };

  const usage = createUsageTotals();

  try {
    const response = await ai.models.generateContent({
      model: SUGGESTION_MODEL,
      contents: [
        { role: "user", parts: [{ text: buildPrompt(locale, snapshot) }] },
      ],
      config: {
        temperature: 0.4,
        maxOutputTokens: 512,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
          includeThoughts: false,
        },
      },
    });
    addUsage(usage, response.usageMetadata);

    const text = response.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    const suggestion = aiSuggestionSchema.parse({
      actionLabel: t("actionDefault"),
      ...JSON.parse(match ? match[0] : text),
    });

    await storeSuggestion(supabase, fingerprint, suggestion);

    return { suggestion };
  } catch (error) {
    console.error("[ai-suggestion] failed", error);
    return { error: t("failed") };
  } finally {
    await finishAiRequest(supabase, quota.requestId, usage);
  }
}
