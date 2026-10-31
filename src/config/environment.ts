export const ENVIRONMENT = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  googleGenAIKey: process.env.GOOGLE_GEN_AI_API_KEY,
  // Server-only admin key (Supabase "secret key"): bypasses RLS, used only to delete an auth user.
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
  // Server-only: events are sent from the server, so the token never reaches the browser.
  posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
  posthogHost: process.env.POSTHOG_HOST,
};
