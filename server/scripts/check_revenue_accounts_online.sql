-- ============================================
-- DIAGNOSTIC QUERY: Check Revenue Accounts on Online Server
-- Run this in MySQL Workbench connected to your online server
-- ============================================

-- 1. Check if Revenue accounts exist in chart_of_accounts
SELECT 
    'REVENUE_ACCOUNTS' as check_type,
    COUNT(*) as count,
    GROUP_CONCAT(CONCAT(code, ' - ', name) SEPARATOR ', ') as accounts
FROM chart_of_accounts
WHERE type = 'Revenue'
    AND deleted_at IS NULL;

-- 2. List all Revenue accounts with details
SELECT 
    'REVENUE_ACCOUNT_DETAILS' as check_type,
    id,
    code,
    name,
    type,
    created_at,
    deleted_at
FROM chart_of_accounts
WHERE type = 'Revenue'
    AND deleted_at IS NULL
ORDER BY code;

-- 3. Check transactions in date range (2025-10-01 to 2025-10-31)
SELECT 
    'TRANSACTIONS_IN_RANGE' as check_type,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN status = 'posted' THEN 1 END) as posted_count,
    COUNT(CASE WHEN status IS NULL OR status = '' THEN 1 END) as null_status_count,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
    MIN(transaction_date) as earliest_date,
    MAX(transaction_date) as latest_date
FROM transactions
WHERE transaction_date >= '2025-10-01'
    AND transaction_date <= '2025-10-31 23:59:59'
    AND deleted_at IS NULL;

-- 4. Check journal entries for revenue accounts in date range
SELECT 
    'REVENUE_JOURNAL_ENTRIES' as check_type,
    COUNT(*) as total_entries,
    COUNT(DISTINCT je.transaction_id) as unique_transactions,
    SUM(je.amount) as total_amount,
    COUNT(DISTINCT je.account_id) as unique_accounts
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE t.transaction_date >= '2025-10-01'
    AND t.transaction_date <= '2025-10-31 23:59:59'
    AND je.entry_type = 'credit'
    AND coa.type = 'Revenue'
    AND je.deleted_at IS NULL
    AND t.deleted_at IS NULL
    AND coa.deleted_at IS NULL;

-- 5. Check journal entries with status breakdown
SELECT 
    'REVENUE_ENTRIES_BY_STATUS' as check_type,
    COALESCE(t.status, 'NULL') as transaction_status,
    COUNT(*) as entry_count,
    COUNT(DISTINCT je.transaction_id) as transaction_count,
    SUM(je.amount) as total_amount
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
GROUP BY t.status;

-- 6. Sample revenue transactions with details
SELECT 
    'SAMPLE_REVENUE_TRANSACTIONS' as check_type,
    t.id as transaction_id,
    t.transaction_type,
    t.transaction_date,
    COALESCE(t.status, 'NULL') as status,
    t.reference,
    t.description,
    coa.code as account_code,
    coa.name as account_name,
    je.entry_type,
    je.amount,
    bh.name as boarding_house_name
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
LEFT JOIN boarding_houses bh ON t.boarding_house_id = bh.id
WHERE t.transaction_date >= '2025-10-01'
    AND t.transaction_date <= '2025-10-31 23:59:59'
    AND je.entry_type = 'credit'
    AND coa.type = 'Revenue'
    AND je.deleted_at IS NULL
    AND t.deleted_at IS NULL
    AND coa.deleted_at IS NULL
ORDER BY t.transaction_date DESC
LIMIT 10;

-- 7. Check if date comparison is the issue (using DATE() vs direct comparison)
SELECT 
    'DATE_COMPARISON_TEST' as check_type,
    COUNT(*) as transactions_with_date_function,
    SUM(je.amount) as total_with_date_function
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE DATE(t.transaction_date) BETWEEN DATE('2025-10-01') AND DATE('2025-10-31')
    AND je.entry_type = 'credit'
    AND coa.type = 'Revenue'
    AND je.deleted_at IS NULL
    AND t.deleted_at IS NULL
    AND coa.deleted_at IS NULL;

SELECT 
    'DATE_COMPARISON_TEST2' as check_type,
    COUNT(*) as transactions_with_direct_comparison,
    SUM(je.amount) as total_with_direct_comparison
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN chart_of_accounts coa ON je.account_id = coa.id
WHERE t.transaction_date >= '2025-10-01'
    AND t.transaction_date <= '2025-10-31 23:59:59'
    AND je.entry_type = 'credit'
    AND coa.type = 'Revenue'
    AND je.deleted_at IS NULL
    AND t.deleted_at IS NULL
    AND coa.deleted_at IS NULL;

-- 8. Check boarding houses
SELECT 
    'BOARDING_HOUSES' as check_type,
    id,
    name,
    deleted_at
FROM boarding_houses
WHERE deleted_at IS NULL;

-- 9. Final revenue query matching the controller (with status filter)
SELECT 
    'FINAL_REVENUE_QUERY_RESULT' as check_type,
    coa.id as account_id,
    coa.name as account_name,
    coa.type as account_type,
    coa.code as account_code,
    bh.id as boarding_house_id,
    bh.name as boarding_house_name,
    COALESCE(SUM(je.amount), 0) as amount,
    COUNT(DISTINCT t.id) as transaction_count
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
GROUP BY coa.id, coa.name, coa.type, coa.code, bh.id, bh.name
ORDER BY coa.code, bh.name;

