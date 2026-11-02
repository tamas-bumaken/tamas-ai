-- The dashboard's AI suggestion: its own quota, and the latest suggestion per user, so opening the dashboard does not
-- call Gemini again until the figures change. Run after 007.

ALTER TABLE public.ai_usage DROP CONSTRAINT IF EXISTS ai_usage_endpoint_check;
ALTER TABLE public.ai_usage ADD CONSTRAINT ai_usage_endpoint_check
    CHECK (endpoint IN ('chat', 'wizard', 'suggestion'));

-- One row per user, replaced by each new suggestion. It quotes the owner's figures, so it is owner-only.
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
    user_id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    -- A hash of the figures and language the suggestion was made from; no figures are stored in it
    fingerprint TEXT NOT NULL,
    suggestion JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own suggestion" ON public.ai_suggestions
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own suggestion" ON public.ai_suggestions
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own suggestion" ON public.ai_suggestions
    FOR UPDATE USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
