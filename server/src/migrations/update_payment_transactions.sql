-- Start transaction
START TRANSACTION;

-- Drop temp table if it exists
DROP TEMPORARY TABLE IF EXISTS temp_payments;

-- Create temporary table to store payment information
CREATE TEMPORARY TABLE temp_payments AS
SELECT 
    sp.id as payment_id,
    sp.payment_type,
    sp.student_id,
    sp.amount,
    sp.payment_date,
    sp.created_by,
    se.currency,
    se.boarding_house_id
FROM student_payments sp
JOIN student_enrollments se ON sp.enrollment_id = se.id
LEFT JOIN transactions t ON t.reference = CONCAT('PMT-', sp.id)
WHERE sp.deleted_at IS NULL
    AND t.id IS NULL;

-- Log count of payments to be processed
SELECT CONCAT('Found ', COUNT(*), ' payments to process') as message
FROM temp_payments;

-- Insert transactions for all found payments
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
    created_at
)
SELECT 
    payment_type,
    student_id,
    CONCAT('PMT-', payment_id),
    amount,
    currency,
    CONCAT(
        REPLACE(payment_type, '_', ' '), 
        ' payment from student ', 
        student_id
    ),
    payment_date,
    boarding_house_id,
    created_by,
    NOW()
FROM temp_payments;

-- Log count of transactions created
SELECT CONCAT('Created ', ROW_COUNT(), ' transaction records') as message;

-- Clean up temporary table
DROP TEMPORARY TABLE IF EXISTS temp_payments;

-- If everything looks good, commit the transaction
COMMIT;

-- Final verification queries
SELECT 'Payments without transactions' as check_type,
    COUNT(*) as count
FROM student_payments sp
LEFT JOIN transactions t ON t.reference = CONCAT('PMT-', sp.id)
WHERE sp.deleted_at IS NULL
    AND t.id IS NULL;

-- Check for payments with transactions but no transaction rules
SELECT 
    'Payments without transaction rules' as check_type,
    COUNT(*) as count,
    GROUP_CONCAT(DISTINCT sp.payment_type) as payment_types_missing_rules
FROM student_payments sp
JOIN transactions t ON t.reference = CONCAT('PMT-', sp.id)
LEFT JOIN transaction_rules tr ON tr.transaction_type = sp.payment_type
WHERE sp.deleted_at IS NULL
    AND tr.id IS NULL;

-- Detailed list of payments missing transaction rules
SELECT 
    sp.id as payment_id,
    sp.payment_type,
    sp.amount,
    sp.payment_date,
    t.id as transaction_id,
    t.reference as transaction_reference
FROM student_payments sp
JOIN transactions t ON t.reference = CONCAT('PMT-', sp.id)
LEFT JOIN transaction_rules tr ON tr.transaction_type = sp.payment_type
WHERE sp.deleted_at IS NULL
    AND tr.id IS NULL
ORDER BY sp.payment_type, sp.payment_date; 