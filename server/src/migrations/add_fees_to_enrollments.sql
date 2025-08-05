-- Add admin fee and security deposit columns to student_enrollments
ALTER TABLE student_enrollments
  ADD COLUMN admin_fee DECIMAL(15,2) DEFAULT 0.00,
  ADD COLUMN security_deposit DECIMAL(15,2) DEFAULT 0.00; 