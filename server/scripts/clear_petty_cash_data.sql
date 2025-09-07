-- Clear All Petty Cash Data
-- This script will remove all petty cash transactions and reset balances
-- WARNING: This will permanently delete all petty cash data!

-- Start transaction for safety
START TRANSACTION;

-- First, let's see what we're about to delete
SELECT 'Petty Cash Accounts' as table_name, COUNT(*) as record_count 
FROM petty_cash_accounts;

SELECT 'Petty Cash Transactions' as table_name, COUNT(*) as record_count 
FROM petty_cash_transactions;

SELECT 'Pending Petty Cash Expenses' as table_name, COUNT(*) as record_count 
FROM pending_petty_cash_expenses;

-- Clear pending petty cash expenses first (child table)
DELETE FROM pending_petty_cash_expenses;

-- Clear petty cash transactions
DELETE FROM petty_cash_transactions;

-- Reset petty cash account balances to zero
UPDATE petty_cash_accounts 
SET 
    current_balance = 0.00,
    beginning_balance = 0.00,
    total_inflows = 0.00,
    total_outflows = 0.00,
    updated_at = CURRENT_TIMESTAMP;

-- Verify the cleanup
SELECT 'After Cleanup - Petty Cash Accounts' as table_name, COUNT(*) as record_count 
FROM petty_cash_accounts;

SELECT 'After Cleanup - Petty Cash Transactions' as table_name, COUNT(*) as record_count 
FROM petty_cash_transactions;

SELECT 'After Cleanup - Pending Petty Cash Expenses' as table_name, COUNT(*) as record_count 
FROM pending_petty_cash_expenses;

-- Show current petty cash account status
SELECT 
    boarding_house_id,
    current_balance,
    beginning_balance,
    total_inflows,
    total_outflows,
    updated_at
FROM petty_cash_accounts;

-- Commit the transaction
COMMIT;

-- Show final status
SELECT '✅ Petty Cash data cleared successfully!' as status;
