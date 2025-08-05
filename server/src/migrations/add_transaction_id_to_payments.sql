-- Add transaction_id column to student_payments table
ALTER TABLE student_payments
ADD COLUMN transaction_id INT,
ADD FOREIGN KEY (transaction_id) REFERENCES transactions(id);

-- Update existing payments to link with transactions if they exist
UPDATE student_payments sp
JOIN transactions t ON 
  t.student_id = sp.student_id 
  AND t.amount = sp.amount 
  AND DATE(t.transaction_date) = DATE(sp.payment_date)
  AND t.deleted_at IS NULL
SET sp.transaction_id = t.id
WHERE sp.transaction_id IS NULL; 