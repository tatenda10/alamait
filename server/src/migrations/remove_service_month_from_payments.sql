-- Remove service_month fields from student_payments table
ALTER TABLE student_payments 
DROP COLUMN service_month;

ALTER TABLE student_payments 
DROP COLUMN service_period_start;

ALTER TABLE student_payments 
DROP COLUMN service_period_end;

-- Remove indexes for service_month
DROP INDEX idx_payments_service_month ON student_payments;
DROP INDEX idx_payments_service_period ON student_payments;
