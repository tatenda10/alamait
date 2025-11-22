-- Income Statement Query for October 2025
-- Run this directly in MySQL Workbench to debug revenue issue

SET @startDate = '2025-10-01';
SET @endDate = '2025-10-31';
SET @boardingHouseId = NULL; -- Set to specific ID or leave NULL for all
SET @isConsolidated = FALSE; -- Set to TRUE for consolidated view

-- ============================================
-- REVENUE QUERY (This is what's returning 0)
-- ============================================
SELECT 
  coa.name as account_name,
  coa.type as account_type,
  coa.id as account_id,
  coa.code as account_code,
  SUM(je.amount) as amount,
  COUNT(DISTINCT t.id) as transaction_count,
  bh.name as boarding_house_name,
  t.status as transaction_status
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
  AND (@isConsolidated = TRUE OR @boardingHouseId IS NULL OR je.boarding_house_id = @boardingHouseId)
GROUP BY coa.id, coa.name, coa.type, coa.code, bh.id, bh.name, t.status
ORDER BY coa.code, bh.name;

-- ============================================
-- DEBUG QUERIES - Run these to diagnose
-- ============================================

-- 1. Check if transactions exist in date range
SELECT 
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN status = 'posted' THEN 1 END) as posted_count,
  COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
  COUNT(CASE WHEN status = 'voided' THEN 1 END) as voided_count,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status_count
FROM transactions 
WHERE transaction_date >= @startDate 
  AND transaction_date <= @endDate
  AND deleted_at IS NULL;

-- 2. Check credit journal entries in date range
SELECT COUNT(*) as credit_entries_count
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND je.entry_type = 'credit'
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL;

-- 3. Check Revenue accounts
SELECT id, code, name, type 
FROM chart_of_accounts 
WHERE type = 'Revenue' 
  AND deleted_at IS NULL
ORDER BY code;

-- 4. Check revenue entries WITHOUT status filter
SELECT 
  COUNT(*) as count,
  SUM(je.amount) as total_amount,
  COUNT(DISTINCT t.id) as transaction_count
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
  AND bh.deleted_at IS NULL;

-- 5. Check revenue entries WITH status filter
SELECT 
  COUNT(*) as count,
  SUM(je.amount) as total_amount,
  COUNT(DISTINCT t.id) as transaction_count
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
  AND bh.deleted_at IS NULL;

-- 6. Check transaction statuses for revenue entries
SELECT 
  t.status,
  COUNT(*) as count,
  SUM(je.amount) as total_amount
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
GROUP BY t.status;

-- 7. Sample revenue transactions (first 10)
SELECT 
  t.id as transaction_id,
  t.transaction_type,
  t.transaction_date,
  t.status,
  t.description,
  coa.code as account_code,
  coa.name as account_name,
  je.amount,
  je.entry_type,
  bh.name as boarding_house_name
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
LIMIT 10;

-- 8. Check if DATE() function makes a difference (timezone issue)
SELECT 
  COUNT(*) as count_with_date_function,
  SUM(je.amount) as total_amount
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE DATE(t.transaction_date) BETWEEN @startDate AND @endDate
  AND (t.status = 'posted' OR t.status IS NULL)
  AND je.entry_type = 'credit'
  AND coa.type = 'Revenue'
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND coa.deleted_at IS NULL;

-- ============================================
-- EXPENSE QUERY (for comparison)
-- ============================================
SELECT 
  coa.name as account_name,
  coa.type as account_type,
  coa.id as account_id,
  coa.code as account_code,
  SUM(je.amount) as amount,
  COUNT(DISTINCT t.id) as transaction_count,
  bh.name as boarding_house_name
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
JOIN boarding_houses bh ON je.boarding_house_id = bh.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND t.status = 'posted'
  AND je.entry_type = 'debit'
  AND coa.type = 'Expense'
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND coa.deleted_at IS NULL
  AND bh.deleted_at IS NULL
  AND (@isConsolidated = TRUE OR @boardingHouseId IS NULL OR je.boarding_house_id = @boardingHouseId)
GROUP BY coa.id, coa.name, coa.type, coa.code, bh.id, bh.name
ORDER BY coa.code, bh.name;


