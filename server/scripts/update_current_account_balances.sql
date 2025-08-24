-- Update current_account_balances table with latest balance data
-- This script will recalculate all account balances based on journal entries

-- First, clear the existing data
TRUNCATE TABLE current_account_balances;

-- Insert updated balance data for all accounts
INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
SELECT 
    coa.id AS account_id,
    coa.code AS account_code,
    coa.name AS account_name,
    coa.type AS account_type,
    COALESCE(
        SUM(
            CASE 
                WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'debit' THEN je.amount
                WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'credit' THEN -je.amount
                WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'credit' THEN je.amount
                WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'debit' THEN -je.amount
                ELSE 0
            END
        ), 0
    ) AS current_balance,
    COALESCE(
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0
    ) AS total_debits,
    COALESCE(
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0
    ) AS total_credits,
    COUNT(DISTINCT je.transaction_id) AS transaction_count,
    MAX(t.transaction_date) AS last_transaction_date
FROM chart_of_accounts coa
LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
LEFT JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL AND t.status = 'posted'
WHERE coa.deleted_at IS NULL
GROUP BY coa.id, coa.code, coa.name, coa.type;

-- Show summary of updated balances
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
WHERE current_balance != 0 OR transaction_count > 0
ORDER BY account_type, account_code;
