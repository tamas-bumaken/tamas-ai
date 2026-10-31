"use server";

import { getCookieTranslations } from "@/i18n/server";
import { loadAdvisorMode } from "@/lib/advisor-settings";
import { captureEvent } from "@/lib/analytics";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  AdvisorFeedback,
  advisorFeedbackSchema,
  chatModeSchema,
} from "@/validations/chatbot-validations";
import z from "zod";

// Expected failures are returned rather than thrown: Next.js hides thrown messages from the client in production.
type ActionResult = { error: string } | { success: true };

// Sent to PostHog only: the rating is a product metric (Phase 1 exit gate), not data the app reads back.
export async function sendAdvisorFeedback(
  input: AdvisorFeedback,
): Promise<ActionResult> {
  const t = await getCookieTranslations("actionErrors");
  const parsed = advisorFeedbackSchema.safeParse(input);

  if (!parsed.success) {
    return { error: t("invalidFeedback") };
  }

  const userId = await requireUserId();
  captureEvent(userId, "advisor_feedback", parsed.data);

  return { success: true };
}

// Read by the Advisor drawer for its mode switch, suggestions and description.
export async function getAdvisorMode() {
  const userId = await requireUserId();
  const supabase = await createClient();
  return loadAdvisorMode(supabase, userId);
}

export async function setAdvisorUsesPersonalData(
  enabled: boolean,
): Promise<ActionResult> {
  const t = await getCookieTranslations("actionErrors");
  const parsed = z.boolean().safeParse(enabled);
  if (!parsed.success) return { error: t("invalidSetting") };

  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ advisor_uses_personal_data: parsed.data })
    .eq("id", userId);

  if (error) {
    console.error("[advisor] failed to update data access", error);
    return { error: t("settingSaveFailed") };
  }

  captureEvent(userId, "advisor_data_access_changed", {
    enabled: parsed.data,
  });
  return { success: true };
}

const MAX_LISTED_CONVERSATIONS = 50;

const conversationRowSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  updated_at: z.string(),
});

const messageRowSchema = z.object({
  role: z.enum(["user", "model"]),
  text: z.string(),
  mode: chatModeSchema.nullable(),
});

// Most recent first (Phase 1 / 1.8). RLS limits the rows to the caller's own conversations.
export async function listAdvisorConversations() {
  await requireUserId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("advisor_conversations")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(MAX_LISTED_CONVERSATIONS);

  if (error) throw new Error(error.message);

  return z
    .array(conversationRowSchema)
    .parse(data)
    .map(({ id, title, updated_at }) => ({ id, title, updatedAt: updated_at }));
}

export async function getAdvisorConversation(conversationId: string) {
  const id = z.uuid().parse(conversationId);
  await requireUserId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("advisor_messages")
    .select("role, text, mode")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    // A question and its answer are inserted together and share created_at; "user" sorts after "model",
    // so descending puts the question first.
    .order("role", { ascending: false });

  if (error) throw new Error(error.message);

  return z.array(messageRowSchema).parse(data);
}

// Its messages go with it (ON DELETE CASCADE).
export async function deleteAdvisorConversation(
  conversationId: string,
): Promise<ActionResult> {
  const t = await getCookieTranslations("actionErrors");
  const parsed = z.uuid().safeParse(conversationId);
  if (!parsed.success) return { error: t("unknownConversation") };

  await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("advisor_conversations")
    .delete()
    .eq("id", parsed.data);

  if (error) {
    console.error("[advisor] failed to delete conversation", error);
    return { error: t("conversationDeleteFailed") };
  }

  return { success: true };
}
