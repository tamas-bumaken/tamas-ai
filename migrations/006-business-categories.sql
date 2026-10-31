-- Business categories for TAMAS, mirrored in src/constans/transaction-categories.ts
-- Rows logged with the old personal categories are mapped so the new constraint can be added; nothing is deleted.

BEGIN;

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_category_check;

UPDATE public.transactions
SET category = 'Other Business Income'
WHERE type = 'income'
    AND category IN ('Salary', 'Side Income', 'Others');

UPDATE public.transactions
SET category = CASE category
    WHEN 'Installments' THEN 'Loan Installments'
    WHEN 'Others' THEN 'Other Business Expense'
    ELSE 'Owner Withdrawal'
END
WHERE type = 'expense'
    AND category IN (
        'Food', 'Transportation', 'Housing', 'Shopping', 'Subscription',
        'Installments', 'Phone & Data', 'Family Transfer', 'Health',
        'Entertainment', 'Education', 'Savings & Investment', 'Others'
    );

-- Same rule as transactionPayloadSchema, so no other client can write a category outside the lists
ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_category_check CHECK (
        (type = 'expense' AND category IN (
            'Raw Materials', 'Staff Wages', 'Rent & Utilities', 'Transport & Delivery',
            'Marketing & Platform Fees', 'Equipment', 'Other Business Expense',
            'Loan Installments', 'Owner Withdrawal', 'Ceremony & Adat'
        ))
        OR (type = 'income' AND category IN ('Sales', 'Other Business Income', 'Owner Capital'))
    );

COMMIT;
