-- Automatic Student Payments Script
-- This script creates payments for all pending payment schedules in boarding house ID 1
-- Treats all payments as cash payments that affect petty cash, journals, transactions, etc.

-- First, let's see what payment schedules we have that are pending
SELECT 
    sps.id as schedule_id,
    sps.enrollment_id,
    sps.student_id,
    s.full_name,
    sps.period_start_date,
    sps.period_end_date,
    sps.amount_due,
    sps.amount_paid,
    sps.currency,
    sps.status,
    se.boarding_house_id
FROM student_payment_schedules sps
JOIN students s ON sps.student_id = s.id
JOIN student_enrollments se ON sps.enrollment_id = se.id
WHERE se.boarding_house_id = 1 
    AND sps.status = 'pending'
    AND sps.deleted_at IS NULL
    AND s.deleted_at IS NULL
    AND se.deleted_at IS NULL
ORDER BY sps.student_id, sps.period_start_date;

-- Now let's create the automatic payments
-- We'll use a transaction to ensure data consistency

START TRANSACTION;

-- Set variables for the script
SET @user_id = 1; -- Default user ID for the script
SET @payment_date = CURDATE(); -- Use current date for payments

-- Step 1: Create transactions for each pending payment schedule
INSERT INTO transactions (
    transaction_type,
    student_id,
    reference,
    amount,
    currency,
    description,
    transaction_date,
    boarding_house_id,
    created_by,
    created_at,
    status
)
SELECT 
    'monthly_rent' as transaction_type,
    sps.student_id,
    CONCAT('PMT-', DATE_FORMAT(@payment_date, '%Y%m%d'), '-', sps.id) as reference,
    sps.amount_due as amount,
    sps.currency,
    CONCAT('Monthly rent payment for ', DATE_FORMAT(sps.period_start_date, '%M %Y'), ' - Cash payment') as description,
    @payment_date as transaction_date,
    se.boarding_house_id,
    @user_id as created_by,
    NOW() as created_at,
    'posted' as status
FROM student_payment_schedules sps
JOIN student_enrollments se ON sps.enrollment_id = se.id
WHERE se.boarding_house_id = 1 
    AND sps.status = 'pending'
    AND sps.deleted_at IS NULL
    AND se.deleted_at IS NULL;

-- Step 2: Create journal entries for each transaction
-- First, get the account IDs for cash and rental income
SET @cash_account_id = (SELECT id FROM chart_of_accounts WHERE code = '10002' AND deleted_at IS NULL LIMIT 1);
SET @rental_income_account_id = (SELECT id FROM chart_of_accounts WHERE code = '40001' AND deleted_at IS NULL LIMIT 1);

-- Create debit entries (Cash account)
INSERT INTO journal_entries (
    transaction_id,
    account_id,
    entry_type,
    amount,
    description,
    boarding_house_id,
    created_by,
    created_at
)
SELECT 
    t.id as transaction_id,
    @cash_account_id as account_id,
    'debit' as entry_type,
    t.amount,
    CONCAT('Monthly rent payment - Debit Cash for ', s.full_name) as description,
    t.boarding_house_id,
    @user_id as created_by,
    NOW() as created_at
FROM transactions t
JOIN students s ON t.student_id = s.id
WHERE t.transaction_type = 'monthly_rent'
    AND t.boarding_house_id = 1
    AND t.created_at >= NOW() - INTERVAL 1 MINUTE; -- Only new transactions from this script

-- Create credit entries (Rental Income account)
INSERT INTO journal_entries (
    transaction_id,
    account_id,
    entry_type,
    amount,
    description,
    boarding_house_id,
    created_by,
    created_at
)
SELECT 
    t.id as transaction_id,
    @rental_income_account_id as account_id,
    'credit' as entry_type,
    t.amount,
    CONCAT('Monthly rent payment - Credit Rental Income for ', s.full_name) as description,
    t.boarding_house_id,
    @user_id as created_by,
    NOW() as created_at
FROM transactions t
JOIN students s ON t.student_id = s.id
WHERE t.transaction_type = 'monthly_rent'
    AND t.boarding_house_id = 1
    AND t.created_at >= NOW() - INTERVAL 1 MINUTE; -- Only new transactions from this script

-- Step 3: Create student payment records
INSERT INTO student_payments (
    student_id,
    enrollment_id,
    schedule_id,
    transaction_id,
    amount,
    payment_date,
    payment_method,
    payment_type,
    reference_number,
    notes,
    created_by,
    status
)
SELECT 
    sps.student_id,
    sps.enrollment_id,
    sps.id as schedule_id,
    t.id as transaction_id,
    sps.amount_due as amount,
    @payment_date as payment_date,
    'cash' as payment_method,
    'monthly_rent' as payment_type,
    t.reference as reference_number,
    CONCAT('Automatic cash payment for ', DATE_FORMAT(sps.period_start_date, '%M %Y')) as notes,
    @user_id as created_by,
    'completed' as status
FROM student_payment_schedules sps
JOIN student_enrollments se ON sps.enrollment_id = se.id
JOIN transactions t ON t.student_id = sps.student_id 
    AND t.transaction_type = 'monthly_rent'
    AND t.created_at >= NOW() - INTERVAL 1 MINUTE
WHERE se.boarding_house_id = 1 
    AND sps.status = 'pending'
    AND sps.deleted_at IS NULL
    AND se.deleted_at IS NULL;

-- Step 4: Update payment schedules to 'paid' status
-- Fixed: Use the primary key (id) in the WHERE clause to avoid safe update mode error
UPDATE student_payment_schedules sps
SET 
    sps.status = 'paid',
    sps.amount_paid = sps.amount_due,
    sps.updated_at = NOW()
WHERE sps.id IN (
    SELECT sps2.id
    FROM student_payment_schedules sps2
    JOIN student_enrollments se ON sps2.enrollment_id = se.id
    WHERE se.boarding_house_id = 1 
        AND sps2.status = 'pending'
        AND sps2.deleted_at IS NULL
        AND se.deleted_at IS NULL
);

-- Step 5: Create petty cash transactions for all cash payments
INSERT INTO petty_cash_transactions (
    boarding_house_id,
    transaction_type,
    amount,
    description,
    reference_number,
    notes,
    transaction_date,
    created_by,
    created_at
)
SELECT 
    t.boarding_house_id,
    'student_payment' as transaction_type,
    t.amount,
    CONCAT('Student payment - monthly rent for ', s.full_name) as description,
    t.reference as reference_number,
    CONCAT('Automatic cash payment for ', DATE_FORMAT(sps.period_start_date, '%M %Y')) as notes,
    @payment_date as transaction_date,
    @user_id as created_by,
    NOW() as created_at
FROM transactions t
JOIN students s ON t.student_id = s.id
JOIN student_payment_schedules sps ON t.student_id = sps.student_id
WHERE t.transaction_type = 'monthly_rent'
    AND t.boarding_house_id = 1
    AND t.created_at >= NOW() - INTERVAL 1 MINUTE;

-- Step 6: Update petty cash account balance
-- Calculate total amount to add to petty cash
SET @total_petty_cash_amount = (
    SELECT COALESCE(SUM(t.amount), 0)
    FROM transactions t
    WHERE t.transaction_type = 'monthly_rent'
        AND t.boarding_house_id = 1
        AND t.created_at >= NOW() - INTERVAL 1 MINUTE
);

-- Insert or update petty cash account
INSERT INTO petty_cash_accounts (
    boarding_house_id,
    current_balance,
    total_inflows,
    created_at
)
VALUES (1, @total_petty_cash_amount, @total_petty_cash_amount, NOW())
ON DUPLICATE KEY UPDATE 
    current_balance = current_balance + @total_petty_cash_amount,
    total_inflows = total_inflows + @total_petty_cash_amount,
    updated_at = NOW();

COMMIT;

-- Verification queries
-- Show all created transactions
SELECT 
    t.id,
    t.transaction_type,
    t.student_id,
    s.full_name,
    t.amount,
    t.currency,
    t.reference,
    t.description,
    t.transaction_date,
    t.status
FROM transactions t
JOIN students s ON t.student_id = s.id
WHERE t.transaction_type = 'monthly_rent'
    AND t.boarding_house_id = 1
    AND t.created_at >= NOW() - INTERVAL 5 MINUTE
ORDER BY t.student_id, t.transaction_date;

-- Show all created journal entries
SELECT 
    je.id,
    je.transaction_id,
    je.account_id,
    coa.code as account_code,
    coa.name as account_name,
    je.entry_type,
    je.amount,
    je.description
FROM journal_entries je
JOIN chart_of_accounts coa ON je.account_id = coa.id
JOIN transactions t ON je.transaction_id = t.id
WHERE t.transaction_type = 'monthly_rent'
    AND t.boarding_house_id = 1
    AND t.created_at >= NOW() - INTERVAL 5 MINUTE
ORDER BY je.transaction_id, je.entry_type;

-- Show all created student payments
SELECT 
    sp.id,
    sp.student_id,
    s.full_name,
    sp.amount,
    sp.payment_method,
    sp.payment_type,
    sp.reference_number,
    sp.payment_date,
    sp.status
FROM student_payments sp
JOIN students s ON sp.student_id = s.id
WHERE sp.created_at >= NOW() - INTERVAL 5 MINUTE
ORDER BY sp.student_id, sp.payment_date;

-- Show updated payment schedules
SELECT 
    sps.id,
    sps.student_id,
    s.full_name,
    sps.period_start_date,
    sps.period_end_date,
    sps.amount_due,
    sps.amount_paid,
    sps.status,
    sps.updated_at
FROM student_payment_schedules sps
JOIN students s ON sps.student_id = s.id
JOIN student_enrollments se ON sps.enrollment_id = se.id
WHERE se.boarding_house_id = 1
    AND sps.updated_at >= NOW() - INTERVAL 5 MINUTE
ORDER BY sps.student_id, sps.period_start_date;

-- Show petty cash transactions
SELECT 
    pct.id,
    pct.transaction_type,
    pct.amount,
    pct.description,
    pct.reference_number,
    pct.transaction_date,
    pct.created_at
FROM petty_cash_transactions pct
WHERE pct.boarding_house_id = 1
    AND pct.created_at >= NOW() - INTERVAL 5 MINUTE
ORDER BY pct.created_at;

-- Show petty cash account balance
SELECT 
    pca.boarding_house_id,
    pca.current_balance,
    pca.total_inflows,
    pca.total_outflows,
    pca.updated_at
FROM petty_cash_accounts pca
WHERE pca.boarding_house_id = 1;

-- Summary of all payments created (Fixed: Removed currency column)
SELECT 
    s.full_name,
    COUNT(sp.id) as total_payments,
    SUM(sp.amount) as total_amount,
    sp.payment_method
FROM student_payments sp
JOIN students s ON sp.student_id = s.id
WHERE sp.created_at >= NOW() - INTERVAL 5 MINUTE
GROUP BY sp.student_id, s.full_name, sp.payment_method
ORDER BY s.full_name;
