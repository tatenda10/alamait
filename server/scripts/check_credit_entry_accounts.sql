-- Check what account types the credit entries are linked to
SET @startDate = '2025-10-01';
SET @endDate = '2025-10-31';

-- Check all credit entries and their account types
SELECT 
  coa.type as account_type,
  coa.code as account_code,
  coa.name as account_name,
  COUNT(*) as credit_entry_count,
  SUM(je.amount) as total_amount,
  COUNT(DISTINCT t.id) as transaction_count
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND je.entry_type = 'credit'
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND coa.deleted_at IS NULL
GROUP BY coa.type, coa.code, coa.name
ORDER BY coa.type, credit_entry_count DESC;

-- Check if there are any Revenue account entries at all (any entry type)
SELECT 
  'Revenue entries check' as check_type,
  je.entry_type,
  COUNT(*) as count,
  SUM(je.amount) as total_amount
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND coa.type = 'Revenue'
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND coa.deleted_at IS NULL
GROUP BY je.entry_type;

-- Check sample transactions to see what they're doing
SELECT 
  t.id as transaction_id,
  t.transaction_type,
  t.transaction_date,
  t.status,
  t.description,
  je.entry_type,
  coa.type as account_type,
  coa.code as account_code,
  coa.name as account_name,
  je.amount
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE t.transaction_date >= @startDate 
  AND t.transaction_date <= @endDate
  AND je.entry_type = 'credit'
  AND je.deleted_at IS NULL
  AND t.deleted_at IS NULL
  AND coa.deleted_at IS NULL
ORDER BY t.transaction_date DESC
LIMIT 10;


