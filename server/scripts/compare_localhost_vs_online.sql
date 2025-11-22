-- Diagnostic query to compare localhost vs online server
-- Run this on BOTH databases to find the difference

SET @startDate = '2025-10-01';
SET @endDate = '2025-10-31';

-- ============================================
-- CHECK 1: Verify transactions exist and dates
-- ============================================
SELECT 
  'CHECK_1_TRANSACTIONS' as check_type,
  COUNT(*) as total_count,
  MIN(transaction_date) as earliest_date,
  MAX(transaction_date) as latest_date,
  COUNT(CASE WHEN transaction_date >= @startDate AND transaction_date <= @endDate THEN 1 END) as in_date_range
FROM transactions 
WHERE deleted_at IS NULL;

-- ============================================
-- CHECK 2: Verify journal entries exist
-- ============================================
SELECT 
  'CHECK_2_JOURNAL_ENTRIES' as check_type,
  COUNT(*) as total_entries,
  COUNT(CASE WHEN entry_type = 'credit' THEN 1 END) as credit_entries,
  COUNT(CASE WHEN entry_type = 'debit' THEN 1 END) as debit_entries
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL;

-- ============================================
-- CHECK 3: Verify Revenue accounts exist and are accessible
-- ============================================
SELECT 
  'CHECK_3_REVENUE_ACCOUNTS' as check_type,
  id,
  code,
  name,
  type,
  deleted_at
FROM chart_of_accounts
WHERE type = 'Revenue'
ORDER BY code;

-- ============================================
-- CHECK 4: Check if joins are working
-- ============================================
SELECT 
  'CHECK_4_JOIN_TEST' as check_type,
  COUNT(*) as join_count,
  COUNT(DISTINCT t.id) as transaction_count,
  COUNT(DISTINCT coa.id) as revenue_account_count
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND je.entry_type = 'credit'
  AND coa.type = 'Revenue'
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND coa.deleted_at IS NULL;

-- ============================================
-- CHECK 5: Check data types and values
-- ============================================
SELECT 
  'CHECK_5_DATA_TYPES' as check_type,
  t.id as transaction_id,
  t.transaction_date,
  t.status,
  je.entry_type,
  coa.type as account_type,
  coa.code as account_code,
  coa.name as account_name,
  je.amount,
  t.deleted_at as t_deleted,
  je.deleted_at as je_deleted,
  coa.deleted_at as coa_deleted
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND je.entry_type = 'credit'
  AND coa.code = '40001'
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND coa.deleted_at IS NULL
LIMIT 5;

-- ============================================
-- CHECK 6: Check for case sensitivity issues
-- ============================================
SELECT 
  'CHECK_6_CASE_SENSITIVITY' as check_type,
  COUNT(*) as count,
  GROUP_CONCAT(DISTINCT coa.type) as account_types_found
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND je.entry_type = 'credit'
  AND UPPER(coa.type) = 'REVENUE'
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND coa.deleted_at IS NULL;

-- ============================================
-- CHECK 7: Check transaction_date data type
-- ============================================
SELECT 
  'CHECK_7_DATE_TYPE' as check_type,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'transactions'
  AND COLUMN_NAME = 'transaction_date';

-- ============================================
-- CHECK 8: Check for NULL or empty values
-- ============================================
SELECT 
  'CHECK_8_NULL_VALUES' as check_type,
  COUNT(*) as total,
  COUNT(CASE WHEN t.transaction_date IS NULL THEN 1 END) as null_dates,
  COUNT(CASE WHEN t.status IS NULL THEN 1 END) as null_status,
  COUNT(CASE WHEN coa.type IS NULL THEN 1 END) as null_account_type,
  COUNT(CASE WHEN je.entry_type IS NULL THEN 1 END) as null_entry_type
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND coa.deleted_at IS NULL;

-- ============================================
-- CHECK 9: Direct query without status filter
-- ============================================
SELECT 
  'CHECK_9_DIRECT_QUERY' as check_type,
  COUNT(*) as count,
  SUM(je.amount) as total
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE t.transaction_date >= '2025-10-01'
  AND t.transaction_date <= '2025-10-31'
  AND je.entry_type = 'credit'
  AND coa.type = 'Revenue'
  AND (je.deleted_at IS NULL OR je.deleted_at = '')
  AND (t.deleted_at IS NULL OR t.deleted_at = '')
  AND (coa.deleted_at IS NULL OR coa.deleted_at = '');


