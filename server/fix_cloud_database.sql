-- Fix ONLY Revenue Account (40001) Balance in Cloud Database
-- This script corrects the negative revenue balance caused by incorrect account balance logic

-- Step 1: Clear existing incorrect balance for revenue account only
DELETE FROM current_account_balances WHERE account_code = '40001';

-- Step 2: Recalculate Revenue Account (40001) balance correctly (without problematic datetime)
INSERT INTO current_account_balances (
    account_id, 
    account_code, 
    account_name, 
    account_type,
    current_balance, 
    total_debits, 
    total_credits, 
    transaction_count,
    last_transaction_date, 
    created_at, 
    updated_at
)
SELECT 
    coa.id as account_id,
    coa.code as account_code,
    coa.name as account_name,
    coa.type as account_type,
    -- For Revenue accounts: Credit increases balance, Debit decreases balance
    COALESCE(SUM(
        CASE 
            WHEN je.entry_type = 'credit' THEN je.amount
            WHEN je.entry_type = 'debit' THEN -je.amount
            ELSE 0
        END
    ), 0) as current_balance,
    COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0) as total_debits,
    COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0) as total_credits,
    COUNT(je.id) as transaction_count,
    -- Use current date to avoid datetime issues
    CURDATE() as last_transaction_date,
    NOW() as created_at,
    NOW() as updated_at
FROM chart_of_accounts coa
LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
WHERE coa.code = '40001' AND coa.deleted_at IS NULL
GROUP BY coa.id, coa.code, coa.name, coa.type;

-- Step 3: Verify the results
SELECT 
    account_code,
    account_name,
    account_type,
    current_balance,
    total_debits,
    total_credits,
    transaction_count,
    last_transaction_date
FROM current_account_balances 
WHERE account_code = '40001';
