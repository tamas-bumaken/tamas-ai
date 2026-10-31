import "server-only";

import { createClient } from "@supabase/supabase-js";
import { ENVIRONMENT } from "@/config/environment";

// Bypasses RLS: use only for what the user's own client cannot do. One caller:
// deleting the signed-in user's auth user (only the id read from their session, never one sent by the client).
export function createAdminClient() {
  if (!ENVIRONMENT.supabaseUrl || !ENVIRONMENT.supabaseSecretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not configured");
  }

  return createClient(ENVIRONMENT.supabaseUrl, ENVIRONMENT.supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
