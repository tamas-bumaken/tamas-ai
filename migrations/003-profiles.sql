-- Profiles: one row per auth user, created by the signup trigger below.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_]{3,30}$'),
    -- Onboarding answers, used as context for the AI Advisor
    monthly_income NUMERIC CHECK (monthly_income >= 0),
    -- The upper bound (current year) is validated in the app; CHECK cannot use now()
    birth_year SMALLINT CHECK (birth_year BETWEEN 1900 AND 2100),
    financial_goal TEXT CHECK (
        financial_goal IN (
            'emergency_fund',
            'pay_off_debt',
            'start_investing',
            'control_spending',
            'save_for_goal'
        )
    ),
    dependents SMALLINT CHECK (dependents BETWEEN 0 AND 20),
    has_debt BOOLEAN,
    -- Set when onboarding is submitted or skipped, so the user is only sent there once
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    -- Whether the advisor may read the user's profile answers and transactions
    advisor_uses_personal_data BOOLEAN NOT NULL DEFAULT true,
    -- UI language; NULL means the user never chose, and the language they browsed with is saved on first sign-in
    locale TEXT CHECK (locale IN ('en', 'id')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- No insert/delete policy: rows are created by the signup trigger and removed by the auth.users cascade
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- Creates a profile for every new auth user
-- Email signups send a username as metadata; OAuth signups carry none, so they get one derived from the email,
-- like the app does (e.g. "budi_4821"), which the user can change on the profile page
-- SECURITY DEFINER is required because the new user has no session yet; an empty search_path prevents hijacking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_username text := NEW.raw_user_meta_data ->> 'username';
    v_base text;
BEGIN
    IF v_username IS NULL THEN
        -- Same rules as suggestUsername in src/actions/auth/actions.ts, so both match ^[a-z0-9_]{3,30}$
        v_base := btrim(left(regexp_replace(lower(split_part(coalesce(NEW.email, ''), '@', 1)), '[^a-z0-9_]+', '_', 'g'), 20), '_');
        IF length(v_base) < 3 THEN
            v_base := 'user';
        END IF;

        -- A 4-digit suffix makes a clash unlikely; retry until a free one is found
        LOOP
            v_username := v_base || '_' || (1000 + floor(random() * 9000))::int;
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username);
        END LOOP;
    END IF;

    INSERT INTO public.profiles (id, username)
    VALUES (NEW.id, v_username);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS hides other users' profiles, so signup cannot check username availability with a plain select
-- Returns only a boolean, never the profile itself
CREATE OR REPLACE FUNCTION public.is_username_available(candidate TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE username = lower(candidate)
    );
$$;

-- Keep updated_at current on every update
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER profiles_set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
