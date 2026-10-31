import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/types/profile";

const PROFILE_COLUMNS =
  "id, username, business_name, business_type, regency, tourist_dependence";

// getClaims verifies the JWT signature; getSession would trust whatever the cookie says.
// An invalid or expired token comes back as an error, which is treated the same as being signed out.
export async function getUserId(): Promise<string | null> {
  // getClaims compares the token expiry with Date.now(), which Cache Components rejects while
  // runtime-prefetching the App Shell; the session check must run per request anyway.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return data?.claims.sub ?? null;
}

export async function requireUserId(): Promise<string> {
  const userId = await getUserId();

  if (!userId) {
    redirect("/login");
  }

  return userId;
}

// Not exported: callers must go through a getter that resolves the user from the session,
// so nobody can ask for another user's profile by passing a different id.
async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

// For Route Handlers, which answer 401 instead of redirecting; null covers both "signed out" and "no profile row".
export async function getProfileForRequest(): Promise<Profile | null> {
  const userId = await getUserId();

  return userId ? getProfileByUserId(userId) : null;
}

// cache() dedupes the lookup when the sidebar and the page both need the profile in one request.
export const getCurrentProfile = cache(async (): Promise<Profile> => {
  const userId = await requireUserId();
  const profile = await getProfileByUserId(userId);

  // The signup trigger creates the row, so a missing one means the database is out of step with auth.users.
  if (!profile) throw new Error("Profile not found");

  return profile;
});
