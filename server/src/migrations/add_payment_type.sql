-- Add payment_type and status columns to student_payments table
ALTER TABLE student_payments
  ADD COLUMN payment_type VARCHAR(50) NOT NULL DEFAULT 'monthly_rent',
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'completed'; 