-- Read-only functions the dashboard, wizard and advisor use on transactions.
-- All run as SECURITY INVOKER (the default), so RLS stays in force; the owner filter is a second layer behind it.

-- Semantic search over the caller's transactions
CREATE OR REPLACE FUNCTION match_transactions (
    query_embedding vector(768),
    match_threshold float,
    match_count int
)

RETURNS TABLE (
    id uuid,
    type text,
    category text,
    amount numeric,
    description text,
    date date,
    user_id uuid,
    similarity float
)

LANGUAGE sql STABLE
AS $$
    SELECT
        transactions.id,
        transactions.type,
        transactions.category,
        transactions.amount,
        transactions.description,
        transactions.date,
        transactions.user_id,
        1 - (transactions.embedding <=> query_embedding) AS similarity
    FROM transactions
    WHERE transactions.user_id = auth.uid()
        AND 1 - (transactions.embedding <=> query_embedding) > match_threshold
    ORDER BY transactions.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Totals per type and category
-- Summing in SQL instead of the app: a plain select is capped by PostgREST's row limit, which would silently undercount
CREATE OR REPLACE FUNCTION summarize_transactions (
    start_date date,
    end_date date
)

RETURNS TABLE (
    type text,
    category text,
    total numeric,
    transaction_count bigint
)

LANGUAGE sql STABLE
AS $$
    SELECT
        transactions.type,
        transactions.category,
        SUM(transactions.amount) AS total,
        COUNT(*) AS transaction_count
    FROM transactions
    WHERE transactions.user_id = auth.uid()
        AND transactions.date BETWEEN start_date AND end_date
    GROUP BY transactions.type, transactions.category
    ORDER BY transactions.type, total DESC;
$$;

-- Exact totals for a filtered set of transactions, so questions like "total kopi bulan ini" are answered from SQL
-- instead of from a handful of semantic search results
CREATE OR REPLACE FUNCTION aggregate_transactions (
    start_date date,
    end_date date,
    -- Matched against the description, case-insensitively; a row counts when any keyword appears in it
    keywords text[] DEFAULT NULL,
    category_filter text DEFAULT NULL,
    type_filter text DEFAULT NULL,
    -- Rows whose description contains any of these are left out, e.g. "kopiah" when counting "kopi"
    exclude_keywords text[] DEFAULT NULL
)

RETURNS jsonb

LANGUAGE sql STABLE
AS $$
    WITH filtered AS (
        SELECT
            transactions.type,
            transactions.category,
            transactions.amount,
            transactions.description,
            transactions.date
        FROM transactions
        WHERE transactions.user_id = auth.uid()
            AND transactions.date BETWEEN start_date AND end_date
            AND (category_filter IS NULL OR transactions.category = category_filter)
            AND (type_filter IS NULL OR transactions.type = type_filter)
            AND (
                keywords IS NULL
                OR cardinality(keywords) = 0
                OR EXISTS (
                    SELECT 1
                    FROM unnest(keywords) AS keyword
                    -- %, _ and \ in a keyword are matched literally, not as LIKE wildcards
                    WHERE transactions.description ILIKE '%' || replace(replace(replace(keyword, '\', '\\'), '%', '\%'), '_', '\_') || '%'
                )
            )
            AND NOT EXISTS (
                SELECT 1
                FROM unnest(COALESCE(exclude_keywords, '{}'::text[])) AS excluded
                WHERE transactions.description ILIKE '%' || replace(replace(replace(excluded, '\', '\\'), '%', '\%'), '_', '\_') || '%'
            )
    )
    SELECT jsonb_build_object(
        -- One entry per type, so income and expense are never added together
        'totals', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object('type', type, 'total', total, 'transaction_count', transaction_count)
                ORDER BY type
            )
            FROM (
                SELECT type, SUM(amount) AS total, COUNT(*) AS transaction_count
                FROM filtered
                GROUP BY type
            ) AS by_type
        ), '[]'::jsonb),
        -- The largest matches, so the model can tell when a keyword caught unrelated rows
        'largest_matches', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'type', type,
                    'category', category,
                    'amount', amount,
                    'description', description,
                    'date', date
                )
                ORDER BY amount DESC, date DESC
            )
            FROM (
                SELECT * FROM filtered ORDER BY amount DESC, date DESC LIMIT 5
            ) AS largest
        ), '[]'::jsonb)
    );
$$;
