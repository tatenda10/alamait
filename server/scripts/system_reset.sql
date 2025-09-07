-- =====================================================
-- SYSTEM RESET SCRIPT
-- This script will clear all operational data and reset
-- the system to a clean state while preserving core structure
-- =====================================================

-- WARNING: This will permanently delete all data!
-- Make sure you have backups before running this script

-- Start transaction for safety
START TRANSACTION;

-- =====================================================
-- 1. CLEAR STUDENT ENROLLMENTS AND RELATED DATA
-- =====================================================

-- Clear payment notifications
DELETE FROM payment_notifications;

-- Clear payment receipts
DELETE FROM payment_receipts;

-- Clear student payments
DELETE FROM student_payments;

-- Clear payment schedules
DELETE FROM student_payment_schedules;

-- Clear student payments
DELETE FROM student_payments;

-- Clear student enrollments (this will cascade to related records)
DELETE FROM student_enrollments;

-- Clear students
DELETE FROM students;

-- =====================================================
-- 2. CLEAR EXPENSES
-- =====================================================

-- Clear expenses
DELETE FROM expenses;

-- Clear petty cash expenses
DELETE FROM petty_cash_expenses;

-- Clear pending petty cash expenses
DELETE FROM pending_petty_cash_expenses;

-- Clear supplier payments
DELETE FROM supplier_payments;

-- =====================================================
-- 3. CLEAR TRANSACTIONS AND JOURNAL ENTRIES
-- =====================================================

-- Clear journal entries first (due to foreign key constraints)
DELETE FROM journal_entries;

-- Clear transactions
DELETE FROM transactions;

-- Clear bank reconciliation records
DELETE FROM bank_reconciliation_records;
DELETE FROM bank_reconciliation_summary;

-- Clear saved income statements
DELETE FROM saved_income_statements;

-- =====================================================
-- 4. RESET ACCOUNT BALANCES
-- =====================================================

-- Reset current account balances to zero
UPDATE current_account_balances 
SET 
    current_balance = 0.00,
    total_debits = 0.00,
    total_credits = 0.00,
    transaction_count = 0,
    last_transaction_date = NULL,
    updated_at = CURRENT_TIMESTAMP;

-- Reset balance BD/CD system
UPDATE balance_bd_cd 
SET 
    balance = 0.00,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- 5. RESET AUTO-INCREMENT COUNTERS
-- =====================================================

-- Reset auto-increment counters for main tables
ALTER TABLE students AUTO_INCREMENT = 1;
ALTER TABLE student_enrollments AUTO_INCREMENT = 1;
ALTER TABLE student_payments AUTO_INCREMENT = 1;
ALTER TABLE student_payment_schedules AUTO_INCREMENT = 1;
ALTER TABLE expenses AUTO_INCREMENT = 1;
ALTER TABLE petty_cash_expenses AUTO_INCREMENT = 1;
ALTER TABLE pending_petty_cash_expenses AUTO_INCREMENT = 1;
ALTER TABLE supplier_payments AUTO_INCREMENT = 1;
ALTER TABLE transactions AUTO_INCREMENT = 1;
ALTER TABLE journal_entries AUTO_INCREMENT = 1;
ALTER TABLE payment_receipts AUTO_INCREMENT = 1;
ALTER TABLE payment_notifications AUTO_INCREMENT = 1;

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Check that all data has been cleared
SELECT 'Students' as table_name, COUNT(*) as record_count FROM students
UNION ALL
SELECT 'Student Enrollments', COUNT(*) FROM student_enrollments
UNION ALL
SELECT 'Student Payments', COUNT(*) FROM student_payments
UNION ALL
SELECT 'Payment Schedules', COUNT(*) FROM student_payment_schedules
UNION ALL
SELECT 'Expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'Petty Cash Expenses', COUNT(*) FROM petty_cash_expenses
UNION ALL
SELECT 'Pending Petty Cash', COUNT(*) FROM pending_petty_cash_expenses
UNION ALL
SELECT 'Supplier Payments', COUNT(*) FROM supplier_payments
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'Journal Entries', COUNT(*) FROM journal_entries
UNION ALL
SELECT 'Payment Receipts', COUNT(*) FROM payment_receipts
UNION ALL
SELECT 'Payment Notifications', COUNT(*) FROM payment_notifications;

-- Check account balances are zero
SELECT 
    account_code,
    account_name,
    current_balance,
    total_debits,
    total_credits,
    transaction_count
FROM current_account_balances
WHERE current_balance != 0 OR total_debits != 0 OR total_credits != 0 OR transaction_count != 0;

-- If everything looks good, commit the transaction
-- If you see any issues, you can run: ROLLBACK;

COMMIT;

-- =====================================================
-- RESET COMPLETE
-- =====================================================

SELECT 'System reset completed successfully!' as status;
SELECT 'All student enrollments, expenses, transactions, and account balances have been cleared.' as message;
SELECT 'The system is now ready for fresh data entry.' as next_steps;
