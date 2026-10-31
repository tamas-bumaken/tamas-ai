import "server-only";

import { createClient } from "@/lib/supabase/server";
import { ChatMode } from "@/validations/chatbot-validations";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const MAX_TITLE_LENGTH = 60;

// The first question names the conversation, shortened on a word boundary when it is long.
export function toConversationTitle(firstMessage: string): string {
  const text = firstMessage.replace(/\s+/g, " ").trim();
  if (text.length <= MAX_TITLE_LENGTH) return text;

  const cut = text.slice(0, MAX_TITLE_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > MAX_TITLE_LENGTH / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

// Stores one finished exchange (Phase 1 / 1.8). Runs with the user's client, so RLS decides: the conversation row is
// created on the first answer, and a conversation id that belongs to someone else makes the message insert fail.
export async function saveExchange(
  supabase: SupabaseClient,
  {
    conversationId,
    firstMessage,
    question,
    answer,
    mode,
  }: {
    conversationId: string;
    firstMessage: string;
    question: string;
    answer: string;
    mode: ChatMode;
  },
): Promise<void> {
  const { error: conversationError } = await supabase
    .from("advisor_conversations")
    .upsert(
      { id: conversationId, title: toConversationTitle(firstMessage) },
      // DO NOTHING for an existing row: the title stays the first question.
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (conversationError) throw new Error(conversationError.message);

  const { error: messageError } = await supabase
    .from("advisor_messages")
    .insert([
      { conversation_id: conversationId, role: "user", text: question },
      { conversation_id: conversationId, role: "model", text: answer, mode },
    ]);
  if (messageError) throw new Error(messageError.message);

  // Keeps the history list ordered by the latest activity.
  const { error: touchError } = await supabase
    .from("advisor_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  if (touchError) throw new Error(touchError.message);
}
