import "server-only";

import { createClient } from "@/lib/supabase/server";
import { ChatMode } from "@/validations/chatbot-validations";
import z from "zod";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const settingsRowSchema = z.object({ advisor_uses_personal_data: z.boolean() });

// The advisor's mode follows the Profile setting (Phase 1 / 1.9), never the request, so a client cannot opt itself
// into reading data the user turned off. RLS limits the row to the caller's own profile.
export async function loadAdvisorMode(
  supabase: SupabaseClient,
  userId: string,
): Promise<ChatMode> {
  const { data, error } = await supabase
    .from("profiles")
    .select("advisor_uses_personal_data")
    .eq("id", userId)
    .single();

  if (error) throw new Error(error.message);

  return settingsRowSchema.parse(data).advisor_uses_personal_data
    ? "personal"
    : "general";
}
