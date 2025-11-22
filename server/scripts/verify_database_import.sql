-- Run this on your ONLINE SERVER to verify what data actually exists
-- Compare these results with your localhost

SET @startDate = '2025-10-01';
SET @endDate = '2025-10-31';

-- ============================================
-- VERIFY 1: Count all tables and their row counts
-- ============================================
SELECT 
  'VERIFY_1_TABLE_COUNTS' as check_type,
  TABLE_NAME,
  TABLE_ROWS
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('transactions', 'journal_entries', 'chart_of_accounts', 'boarding_houses', 'students', 'student_enrollments')
ORDER BY TABLE_NAME;

-- ============================================
-- VERIFY 2: Count transactions in October 2025
-- ============================================
SELECT 
  'VERIFY_2_OCTOBER_TRANSACTIONS' as check_type,
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN transaction_date >= @startDate AND transaction_date <= @endDate THEN 1 END) as in_october,
  MIN(transaction_date) as earliest_date,
  MAX(transaction_date) as latest_date
FROM transactions
WHERE deleted_at IS NULL;

-- ============================================
-- VERIFY 3: Count journal entries for October transactions
-- ============================================
SELECT 
  'VERIFY_3_OCTOBER_JOURNAL_ENTRIES' as check_type,
  COUNT(*) as total_entries,
  COUNT(CASE WHEN je.entry_type = 'credit' THEN 1 END) as credit_entries,
  COUNT(CASE WHEN je.entry_type = 'debit' THEN 1 END) as debit_entries
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL;

-- ============================================
-- VERIFY 4: Check Revenue accounts
-- ============================================
SELECT 
  'VERIFY_4_REVENUE_ACCOUNTS' as check_type,
  id,
  code,
  name,
  type,
  deleted_at
FROM chart_of_accounts
WHERE type = 'Revenue'
ORDER BY code;

-- ============================================
-- VERIFY 5: Check if Revenue journal entries exist (any way)
-- ============================================
SELECT 
  'VERIFY_5_REVENUE_ENTRIES_ANY' as check_type,
  COUNT(*) as total_revenue_entries,
  SUM(je.amount) as total_amount
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND coa.code = '40001'  -- Rentals Income
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND coa.deleted_at IS NULL;

-- ============================================
-- VERIFY 6: Check sample transactions that should have revenue
-- ============================================
SELECT 
  'VERIFY_6_SAMPLE_TXNS' as check_type,
  t.id,
  t.transaction_type,
  t.transaction_date,
  t.status,
  COUNT(je.id) as journal_entry_count
FROM transactions t
LEFT JOIN journal_entries je ON t.id = je.transaction_id AND je.deleted_at IS NULL
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND t.transaction_type IN ('monthly_invoice', 'initial_invoice')
  AND t.deleted_at IS NULL
GROUP BY t.id, t.transaction_type, t.transaction_date, t.status
ORDER BY t.transaction_date DESC
LIMIT 10;

-- ============================================
-- VERIFY 7: Check for orphaned journal entries
-- ============================================
SELECT 
  'VERIFY_7_ORPHANED_ENTRIES' as check_type,
  COUNT(*) as orphaned_count
FROM journal_entries je
LEFT JOIN transactions t ON je.transaction_id = t.id
WHERE je.deleted_at IS NULL
  AND (t.id IS NULL OR t.deleted_at IS NOT NULL);

-- ============================================
-- VERIFY 8: Check for missing foreign keys
-- ============================================
SELECT 
  'VERIFY_8_MISSING_FK' as check_type,
  COUNT(*) as missing_account_count
FROM journal_entries je
LEFT JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE je.deleted_at IS NULL
  AND (coa.id IS NULL OR coa.deleted_at IS NOT NULL);


