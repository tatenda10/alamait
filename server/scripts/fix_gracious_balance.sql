-- Fix Gracious's student balance to -160
-- First, let's check the current balance
SELECT 
  s.id as student_id,
  s.full_name,
  se.id as enrollment_id,
  sab.current_balance,
  se.agreed_amount,
  se.admin_fee
FROM students s
JOIN student_enrollments se ON s.id = se.student_id
LEFT JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
WHERE s.full_name LIKE '%Gracious%'
  AND s.deleted_at IS NULL
  AND se.deleted_at IS NULL
ORDER BY se.created_at DESC
LIMIT 5;

-- Update the balance to -160
-- Replace the student_id and enrollment_id with the actual values from the query above
UPDATE student_account_balances
SET current_balance = -160.00,
    updated_at = NOW()
WHERE student_id = (
  SELECT id FROM students 
  WHERE full_name LIKE '%Gracious%' 
    AND deleted_at IS NULL 
  LIMIT 1
)
AND enrollment_id = (
  SELECT se.id 
  FROM student_enrollments se
  JOIN students s ON se.student_id = s.id
  WHERE s.full_name LIKE '%Gracious%'
    AND s.deleted_at IS NULL
    AND se.deleted_at IS NULL
  ORDER BY se.created_at DESC
  LIMIT 1
);

-- Verify the update
SELECT 
  s.full_name,
  sab.current_balance,
  sab.updated_at
FROM students s
JOIN student_enrollments se ON s.id = se.student_id
JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
WHERE s.full_name LIKE '%Gracious%'
  AND s.deleted_at IS NULL
  AND se.deleted_at IS NULL
ORDER BY se.created_at DESC
LIMIT 1;

