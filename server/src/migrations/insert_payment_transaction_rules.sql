-- Start transaction
START TRANSACTION;

-- First, let's see what payment types we have without rules
SELECT DISTINCT payment_type 
FROM student_payments 
WHERE payment_type NOT IN (
    SELECT transaction_type 
    FROM transaction_rules 
    WHERE deleted_at IS NULL
);

-- For each boarding house, insert transaction rules
INSERT INTO transaction_rules 
(transaction_type, debit_account_id, credit_account_id, auto_post, notes)
SELECT DISTINCT
    'monthly_rent',
    d.id as debit_account_id,
    c.id as credit_account_id,
    1,
    'Monthly rent payment - Cash/Bank to Rental Income'
FROM boarding_houses bh
JOIN chart_of_accounts_branch d ON d.branch_id = bh.id AND d.code = '10002' AND d.deleted_at IS NULL -- Cash account
JOIN chart_of_accounts_branch c ON c.branch_id = bh.id AND c.code = '40001' AND c.deleted_at IS NULL -- Rental Income
WHERE NOT EXISTS (
    SELECT 1 FROM transaction_rules 
    WHERE transaction_type = 'monthly_rent' 
    AND deleted_at IS NULL
);

-- For admin_fee
INSERT INTO transaction_rules 
(transaction_type, debit_account_id, credit_account_id, auto_post, notes)
SELECT DISTINCT
    'admin_fee',
    d.id as debit_account_id,
    c.id as credit_account_id,
    1,
    'Admin fee payment - Cash/Bank to Fee Income'
FROM boarding_houses bh
JOIN chart_of_accounts_branch d ON d.branch_id = bh.id AND d.code = '10002' AND d.deleted_at IS NULL -- Cash account
JOIN chart_of_accounts_branch c ON c.branch_id = bh.id AND c.code = '40002' AND c.deleted_at IS NULL -- Fee Income
WHERE NOT EXISTS (
    SELECT 1 FROM transaction_rules 
    WHERE transaction_type = 'admin_fee' 
    AND deleted_at IS NULL
);

-- For security_deposit
INSERT INTO transaction_rules 
(transaction_type, debit_account_id, credit_account_id, auto_post, notes)
SELECT DISTINCT
    'security_deposit',
    d.id as debit_account_id,
    c.id as credit_account_id,
    1,
    'Security deposit payment - Cash/Bank to Security Deposits Payable'
FROM boarding_houses bh
JOIN chart_of_accounts_branch d ON d.branch_id = bh.id AND d.code = '10002' AND d.deleted_at IS NULL -- Cash account
JOIN chart_of_accounts_branch c ON c.branch_id = bh.id AND c.code = '20001' AND c.deleted_at IS NULL -- Security Deposits Payable
WHERE NOT EXISTS (
    SELECT 1 FROM transaction_rules 
    WHERE transaction_type = 'security_deposit' 
    AND deleted_at IS NULL
);

-- For penalty_fee
INSERT INTO transaction_rules 
(transaction_type, debit_account_id, credit_account_id, auto_post, notes)
SELECT DISTINCT
    'penalty_fee',
    d.id as debit_account_id,
    c.id as credit_account_id,
    1,
    'Penalty fee payment - Cash/Bank to Penalty Income'
FROM boarding_houses bh
JOIN chart_of_accounts_branch d ON d.branch_id = bh.id AND d.code = '10002' AND d.deleted_at IS NULL -- Cash account
JOIN chart_of_accounts_branch c ON c.branch_id = bh.id AND c.code = '40003' AND c.deleted_at IS NULL -- Penalty Income
WHERE NOT EXISTS (
    SELECT 1 FROM transaction_rules 
    WHERE transaction_type = 'penalty_fee' 
    AND deleted_at IS NULL
);

-- For expenses
INSERT INTO transaction_rules 
(transaction_type, debit_account_id, credit_account_id, auto_post, notes)
SELECT DISTINCT
    'expense',
    d.id as debit_account_id,
    c.id as credit_account_id,
    1,
    'Expense transaction - Expense Account to Cash/Bank'
FROM boarding_houses bh
JOIN chart_of_accounts_branch d ON d.branch_id = bh.id AND d.type = 'Expense' AND d.deleted_at IS NULL -- Expense accounts
JOIN chart_of_accounts_branch c ON c.branch_id = bh.id AND c.code = '10002' AND c.deleted_at IS NULL -- Cash account
WHERE NOT EXISTS (
    SELECT 1 FROM transaction_rules 
    WHERE transaction_type = 'expense' 
    AND deleted_at IS NULL
);

-- Verify the rules were inserted
SELECT 
    tr.transaction_type,
    d.code as debit_account_code,
    d.name as debit_account_name,
    c.code as credit_account_code,
    c.name as credit_account_name,
    tr.auto_post,
    tr.notes
FROM transaction_rules tr
JOIN chart_of_accounts_branch d ON tr.debit_account_id = d.id
JOIN chart_of_accounts_branch c ON tr.credit_account_id = c.id
WHERE tr.deleted_at IS NULL;

-- Show any payment types that still don't have rules
SELECT DISTINCT 
    sp.payment_type,
    COUNT(*) as payment_count
FROM student_payments sp
LEFT JOIN transaction_rules tr ON tr.transaction_type = sp.payment_type
WHERE tr.id IS NULL
    AND sp.deleted_at IS NULL
GROUP BY sp.payment_type;

COMMIT; 