-- Create Payment Schedules for Students in Boarding House ID 4
-- This script creates monthly payment schedules from March to June 2025

-- First, let's see what enrollments we have for boarding house ID 4
SELECT 
    se.id as enrollment_id,
    se.student_id,
    s.full_name,
    se.start_date,
    se.expected_end_date,
    se.agreed_amount,
    se.currency,
    se.boarding_house_id
FROM student_enrollments se
JOIN students s ON se.student_id = s.id
WHERE se.boarding_house_id = 4 
    AND se.deleted_at IS NULL
    AND s.deleted_at IS NULL
ORDER BY se.student_id, se.start_date;

-- Now create the payment schedules for March to June 2025
INSERT INTO student_payment_schedules (
    enrollment_id,
    student_id,
    period_start_date,
    period_end_date,
    amount_due,
    amount_paid,
    currency,
    status,
    notes,
    created_at,
    updated_at
)
SELECT 
    se.id as enrollment_id,
    se.student_id,
    period_dates.period_start_date,
    period_dates.period_end_date,
    se.agreed_amount as amount_due,
    0.00 as amount_paid, -- Initially no payments made
    se.currency,
    'pending' as status,
    CONCAT('Monthly payment for ', DATE_FORMAT(period_dates.period_start_date, '%M %Y')) as notes,
    NOW() as created_at,
    NOW() as updated_at
FROM student_enrollments se
CROSS JOIN (
    SELECT '2025-03-01' as period_start_date, '2025-03-31' as period_end_date UNION ALL
    SELECT '2025-04-01' as period_start_date, '2025-04-30' as period_end_date UNION ALL
    SELECT '2025-05-01' as period_start_date, '2025-05-31' as period_end_date UNION ALL
    SELECT '2025-06-01' as period_start_date, '2025-06-30' as period_end_date
) period_dates
WHERE se.boarding_house_id = 4 
    AND se.deleted_at IS NULL
    AND se.start_date <= period_dates.period_end_date  -- Only create schedules for periods after enrollment start
    AND (se.expected_end_date IS NULL OR se.expected_end_date >= period_dates.period_start_date)  -- Only create schedules for periods before expected end
ORDER BY se.student_id, period_dates.period_start_date;

-- Verify the created payment schedules
SELECT 
    sps.id,
    sps.enrollment_id,
    sps.student_id,
    s.full_name,
    sps.period_start_date,
    sps.period_end_date,
    sps.amount_due,
    sps.amount_paid,
    sps.currency,
    sps.status,
    sps.notes,
    sps.created_at
FROM student_payment_schedules sps
JOIN students s ON sps.student_id = s.id
WHERE sps.enrollment_id IN (
    SELECT id FROM student_enrollments WHERE boarding_house_id = 4 AND deleted_at IS NULL
)
ORDER BY sps.student_id, sps.period_start_date;

-- Summary of created schedules
SELECT 
    s.full_name,
    COUNT(sps.id) as total_schedules,
    SUM(sps.amount_due) as total_amount_due,
    SUM(sps.amount_paid) as total_amount_paid,
    sps.currency
FROM student_payment_schedules sps
JOIN students s ON sps.student_id = s.id
WHERE sps.enrollment_id IN (
    SELECT id FROM student_enrollments WHERE boarding_house_id = 4 AND deleted_at IS NULL
)
GROUP BY sps.student_id, s.full_name, sps.currency
ORDER BY s.full_name;
