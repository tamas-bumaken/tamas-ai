-- Business profile for TAMAS: what the advisor needs to know about the business, instead of the owner's personal
-- finances. Values are mirrored in src/constans/business-profile.ts. Every answer is optional.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS business_name TEXT CHECK (char_length(business_name) BETWEEN 1 AND 80),
    ADD COLUMN IF NOT EXISTS business_type TEXT CHECK (
        business_type IN ('food_stall', 'grocery', 'souvenir_craft', 'services', 'other')
    ),
    ADD COLUMN IF NOT EXISTS regency TEXT CHECK (
        regency IN (
            'badung', 'bangli', 'buleleng', 'denpasar', 'gianyar',
            'jembrana', 'karangasem', 'klungkung', 'tabanan'
        )
    ),
    ADD COLUMN IF NOT EXISTS tourist_dependence TEXT CHECK (
        tourist_dependence IN ('high', 'partial', 'none')
    ),
    DROP COLUMN IF EXISTS monthly_income,
    DROP COLUMN IF EXISTS birth_year,
    DROP COLUMN IF EXISTS financial_goal,
    DROP COLUMN IF EXISTS dependents,
    DROP COLUMN IF EXISTS has_debt;
