-- Transactions: every row belongs to one user, and only that user can reach it.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    -- New rows are owned by the caller without the app having to send user_id
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Must match EMBEDDING_DIMENSIONS in src/lib/embedding.ts
    embedding VECTOR(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- One category list for the whole app, mirrored in src/constans/transaction-categories.ts
    CONSTRAINT transactions_category_check CHECK (
        (type = 'expense' AND category IN (
            'Food', 'Transportation', 'Housing', 'Shopping', 'Subscription',
            'Installments', 'Phone & Data', 'Family Transfer', 'Health',
            'Entertainment', 'Education', 'Savings & Investment', 'Others'
        ))
        OR (type = 'income' AND category IN ('Salary', 'Side Income', 'Others'))
    )
);

CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions (user_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own transactions" ON public.transactions
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own transactions" ON public.transactions
    FOR UPDATE USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own transactions" ON public.transactions
    FOR DELETE USING ((SELECT auth.uid()) = user_id);
