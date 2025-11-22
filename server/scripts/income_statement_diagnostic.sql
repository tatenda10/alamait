-- Complete Income Statement Diagnostic Query
-- Run this single query to get all diagnostic information at once
-- Results will show in multiple result sets

SET @startDate = '2025-10-01';
SET @endDate = '2025-10-31';

-- ============================================
-- MAIN REVENUE QUERY (The one that's returning 0)
-- ============================================
SELECT 
  'REVENUE_QUERY' as query_type,
  coa.id as account_id,
  coa.code as account_code,
  coa.name as account_name,
  SUM(je.amount) as amount,
  COUNT(DISTINCT t.id) as transaction_count,
  bh.name as boarding_house_name,
  t.status as transaction_status,
  NULL as debug_info
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
JOIN boarding_houses bh ON je.boarding_house_id = bh.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND (t.status = 'posted' OR t.status IS NULL)
  AND je.entry_type = 'credit'
  AND coa.type = 'Revenue'
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND coa.deleted_at IS NULL
  AND bh.deleted_at IS NULL
GROUP BY coa.id, coa.name, coa.type, coa.code, bh.id, bh.name, t.status

UNION ALL

-- ============================================
-- DEBUG 1: Transaction counts by status
-- ============================================
SELECT 
  'DEBUG_1_TRANSACTIONS' as query_type,
  NULL as account_id,
  NULL as account_code,
  CONCAT('Total: ', COUNT(*), ' | Posted: ', COUNT(CASE WHEN status = 'posted' THEN 1 END), 
         ' | Draft: ', COUNT(CASE WHEN status = 'draft' THEN 1 END),
         ' | Voided: ', COUNT(CASE WHEN status = 'voided' THEN 1 END),
         ' | NULL: ', COUNT(CASE WHEN status IS NULL THEN 1 END)) as account_name,
  COUNT(*) as amount,
  NULL as transaction_count,
  NULL as boarding_house_name,
  NULL as transaction_status,
  'Transactions in date range' as debug_info
FROM transactions 
WHERE transaction_date >= @startDate 
  AND transaction_date <= @endDate
  AND deleted_at IS NULL

UNION ALL

-- ============================================
-- DEBUG 2: Credit journal entries count
-- ============================================
SELECT 
  'DEBUG_2_CREDIT_ENTRIES' as query_type,
  NULL as account_id,
  NULL as account_code,
  CONCAT('Total credit entries: ', COUNT(*)) as account_name,
  COUNT(*) as amount,
  NULL as transaction_count,
  NULL as boarding_house_name,
  NULL as transaction_status,
  'Credit journal entries in date range' as debug_info
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND je.entry_type = 'credit'
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL

UNION ALL

-- ============================================
-- DEBUG 3: Revenue accounts list
-- ============================================
SELECT 
  'DEBUG_3_REVENUE_ACCOUNTS' as query_type,
  coa.id as account_id,
  coa.code as account_code,
  coa.name as account_name,
  NULL as amount,
  NULL as transaction_count,
  NULL as boarding_house_name,
  NULL as transaction_status,
  'Revenue accounts in chart_of_accounts' as debug_info
FROM chart_of_accounts coa
WHERE coa.type = 'Revenue' 
  AND coa.deleted_at IS NULL

UNION ALL

-- ============================================
-- DEBUG 4: Revenue entries WITHOUT status filter
-- ============================================
SELECT 
  'DEBUG_4_REVENUE_NO_STATUS' as query_type,
  NULL as account_id,
  NULL as account_code,
  CONCAT('Count: ', COUNT(*), ' | Total: $', COALESCE(SUM(je.amount), 0), 
         ' | Transactions: ', COUNT(DISTINCT t.id)) as account_name,
  COALESCE(SUM(je.amount), 0) as amount,
  COUNT(DISTINCT t.id) as transaction_count,
  NULL as boarding_house_name,
  NULL as transaction_status,
  'Revenue entries WITHOUT status filter' as debug_info
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
JOIN boarding_houses bh ON je.boarding_house_id = bh.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND je.entry_type = 'credit'
  AND coa.type = 'Revenue'
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND coa.deleted_at IS NULL
  AND bh.deleted_at IS NULL

UNION ALL

-- ============================================
-- DEBUG 5: Revenue entries WITH status filter
-- ============================================
SELECT 
  'DEBUG_5_REVENUE_WITH_STATUS' as query_type,
  NULL as account_id,
  NULL as account_code,
  CONCAT('Count: ', COUNT(*), ' | Total: $', COALESCE(SUM(je.amount), 0), 
         ' | Transactions: ', COUNT(DISTINCT t.id)) as account_name,
  COALESCE(SUM(je.amount), 0) as amount,
  COUNT(DISTINCT t.id) as transaction_count,
  NULL as boarding_house_name,
  NULL as transaction_status,
  'Revenue entries WITH status filter (posted or NULL)' as debug_info
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
JOIN boarding_houses bh ON je.boarding_house_id = bh.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND (t.status = 'posted' OR t.status IS NULL)
  AND je.entry_type = 'credit'
  AND coa.type = 'Revenue'
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND coa.deleted_at IS NULL
  AND bh.deleted_at IS NULL

UNION ALL

-- ============================================
-- DEBUG 6: Transaction statuses breakdown
-- ============================================
SELECT 
  'DEBUG_6_STATUS_BREAKDOWN' as query_type,
  NULL as account_id,
  NULL as account_code,
  CONCAT('Status: ', COALESCE(t.status, 'NULL'), ' | Count: ', COUNT(*), 
         ' | Total: $', COALESCE(SUM(je.amount), 0)) as account_name,
  COALESCE(SUM(je.amount), 0) as amount,
  COUNT(*) as transaction_count,
  NULL as boarding_house_name,
  COALESCE(t.status, 'NULL') as transaction_status,
  'Revenue transactions by status' as debug_info
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND je.entry_type = 'credit'
  AND coa.type = 'Revenue'
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND coa.deleted_at IS NULL
GROUP BY t.status

UNION ALL

-- ============================================
-- DEBUG 7: Sample revenue transactions (first 5)
-- ============================================
SELECT 
  'DEBUG_7_SAMPLE_TRANSACTIONS' as query_type,
  t.id as account_id,
  coa.code as account_code,
  CONCAT('Txn: ', t.id, ' | Type: ', t.transaction_type, ' | Date: ', t.transaction_date, 
         ' | Status: ', COALESCE(t.status, 'NULL'), ' | Amount: $', je.amount) as account_name,
  je.amount as amount,
  NULL as transaction_count,
  bh.name as boarding_house_name,
  COALESCE(t.status, 'NULL') as transaction_status,
  CONCAT('Sample: ', t.description) as debug_info
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
JOIN boarding_houses bh ON je.boarding_house_id = bh.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND coa.type = 'Revenue'
  AND je.entry_type = 'credit'
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND coa.deleted_at IS NULL
ORDER BY t.transaction_date DESC
LIMIT 5

UNION ALL

-- ============================================
-- DEBUG 8: DATE() function test (timezone check)
-- ============================================
SELECT 
  'DEBUG_8_DATE_FUNCTION' as query_type,
  NULL as account_id,
  NULL as account_code,
  CONCAT('Using DATE() function: Count: ', COUNT(*), ' | Total: $', COALESCE(SUM(je.amount), 0)) as account_name,
  COALESCE(SUM(je.amount), 0) as amount,
  COUNT(*) as transaction_count,
  NULL as boarding_house_name,
  NULL as transaction_status,
  'Revenue with DATE() function (timezone test)' as debug_info
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE DATE(t.transaction_date) BETWEEN @startDate AND @endDate
  AND (t.status = 'posted' OR t.status IS NULL)
  AND je.entry_type = 'credit'
  AND coa.type = 'Revenue'
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND coa.deleted_at IS NULL

ORDER BY query_type, account_code;

