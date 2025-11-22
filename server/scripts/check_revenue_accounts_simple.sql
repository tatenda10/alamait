-- ============================================
-- SIMPLE DIAGNOSTIC QUERY: Check Revenue Accounts on Online Server
-- Run this single query in MySQL Workbench to get all diagnostic info at once
-- ============================================

SELECT 
    '1. Revenue Accounts Count' as check_name,
    COUNT(*) as value,
    GROUP_CONCAT(CONCAT(code, ' - ', name) SEPARATOR ' | ') as details
FROM chart_of_accounts
WHERE type = 'Revenue' AND deleted_at IS NULL

UNION ALL

SELECT 
    '2. Transactions in Range (2025-10-01 to 2025-10-31)' as check_name,
    COUNT(*) as value,
    CONCAT('Posted: ', COUNT(CASE WHEN status = 'posted' THEN 1 END), 
           ' | NULL: ', COUNT(CASE WHEN status IS NULL OR status = '' THEN 1 END),
           ' | Draft: ', COUNT(CASE WHEN status = 'draft' THEN 1 END)) as details
FROM transactions
WHERE transaction_date >= '2025-10-01'
    AND transaction_date <= '2025-10-31 23:59:59'
    AND deleted_at IS NULL

UNION ALL

SELECT 
    '3. Revenue Journal Entries (Credit)' as check_name,
    COUNT(*) as value,
    CONCAT('Total Amount: $', COALESCE(SUM(je.amount), 0), 
           ' | Transactions: ', COUNT(DISTINCT je.transaction_id),
           ' | Accounts: ', COUNT(DISTINCT je.account_id)) as details
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE t.transaction_date >= '2025-10-01'
    AND t.transaction_date <= '2025-10-31 23:59:59'
    AND je.entry_type = 'credit'
    AND coa.type = 'Revenue'
    AND je.deleted_at IS NULL
    AND t.deleted_at IS NULL
    AND coa.deleted_at IS NULL

UNION ALL

SELECT 
    '4. Revenue Entries with Status Filter' as check_name,
    COUNT(*) as value,
    CONCAT('Total Amount: $', COALESCE(SUM(je.amount), 0),
           ' | Posted: ', COUNT(CASE WHEN t.status = 'posted' THEN 1 END),
           ' | NULL: ', COUNT(CASE WHEN t.status IS NULL OR t.status = '' THEN 1 END)) as details
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE t.transaction_date >= '2025-10-01'
    AND t.transaction_date <= '2025-10-31 23:59:59'
    AND (t.status = 'posted' OR t.status IS NULL OR t.status = '')
    AND je.entry_type = 'credit'
    AND UPPER(TRIM(coa.type)) = 'REVENUE'
    AND je.deleted_at IS NULL
    AND t.deleted_at IS NULL
    AND coa.deleted_at IS NULL

UNION ALL

SELECT 
    '5. Final Revenue Query Result' as check_name,
    COUNT(DISTINCT coa.id) as value,
    CONCAT('Total Revenue: $', COALESCE(SUM(je.amount), 0),
           ' | Accounts: ', COUNT(DISTINCT coa.id),
           ' | Transactions: ', COUNT(DISTINCT t.id)) as details
FROM journal_entries je
INNER JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL
INNER JOIN chart_of_accounts coa ON je.account_id = coa.id AND coa.deleted_at IS NULL
INNER JOIN boarding_houses bh ON je.boarding_house_id = bh.id AND bh.deleted_at IS NULL
WHERE t.transaction_date >= '2025-10-01'
    AND t.transaction_date <= '2025-10-31 23:59:59'
    AND (t.status = 'posted' OR t.status IS NULL OR t.status = '')
    AND je.entry_type = 'credit'
    AND UPPER(TRIM(coa.type)) = 'REVENUE'
    AND je.deleted_at IS NULL

ORDER BY check_name;

