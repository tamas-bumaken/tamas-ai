-- One row per AI request (chat or wizard): the base for per-user quotas and for measuring AI cost
-- Rows are written only through the SECURITY DEFINER functions below. With RLS on and no policies, users can
-- neither read nor touch the table directly, so nobody can delete their rows to reset a quota
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL CHECK (endpoint IN ('chat', 'wizard')),
    model TEXT NOT NULL,
    -- Summed over every Gemini call of the request (tool rounds included); NULL until the request finishes
    input_tokens INTEGER,
    output_tokens INTEGER,
    thinking_tokens INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS ai_usage_user_endpoint_created_idx
    ON public.ai_usage (user_id, endpoint, created_at DESC);

-- Checks the caller's limits and, when a slot is free, records the request before any Gemini call is made
-- Returns the new row id, or the reason the request was rejected ('rate_limit' or 'daily_quota')
CREATE OR REPLACE FUNCTION public.start_ai_request (
    p_endpoint text,
    p_model text,
    p_per_minute_limit int,
    p_daily_limit int
)

RETURNS TABLE (
    request_id uuid,
    rejected_reason text
)

LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    -- Quotas reset at midnight in Jakarta, where the users are
    v_day_start timestamptz :=
        date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta';
    v_request_id uuid;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Serializes one user's concurrent requests, so two of them cannot both take the last free slot
    PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || p_endpoint, 0));

    IF (
        SELECT COUNT(*) FROM public.ai_usage
        WHERE user_id = v_user_id
            AND endpoint = p_endpoint
            AND created_at > now() - interval '1 minute'
    ) >= p_per_minute_limit THEN
        RETURN QUERY SELECT NULL::uuid, 'rate_limit'::text;
        RETURN;
    END IF;

    IF (
        SELECT COUNT(*) FROM public.ai_usage
        WHERE user_id = v_user_id
            AND endpoint = p_endpoint
            AND created_at >= v_day_start
    ) >= p_daily_limit THEN
        RETURN QUERY SELECT NULL::uuid, 'daily_quota'::text;
        RETURN;
    END IF;

    INSERT INTO public.ai_usage (user_id, endpoint, model)
    VALUES (v_user_id, p_endpoint, p_model)
    RETURNING id INTO v_request_id;

    RETURN QUERY SELECT v_request_id, NULL::text;
END;
$$;

-- Stores the token counts once; a finished row cannot be changed again
CREATE OR REPLACE FUNCTION public.finish_ai_request (
    p_request_id uuid,
    p_input_tokens int,
    p_output_tokens int,
    p_thinking_tokens int
)

RETURNS void

LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    UPDATE public.ai_usage
    SET input_tokens = p_input_tokens,
        output_tokens = p_output_tokens,
        thinking_tokens = p_thinking_tokens,
        completed_at = now()
    WHERE id = p_request_id
        AND user_id = auth.uid()
        AND completed_at IS NULL;
$$;

-- Signed-in users only; Supabase grants EXECUTE to anon by default
REVOKE EXECUTE ON FUNCTION public.start_ai_request (text, text, int, int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.finish_ai_request (uuid, int, int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_ai_request (text, text, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_ai_request (uuid, int, int, int) TO authenticated;
