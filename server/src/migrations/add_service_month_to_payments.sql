-- Add service_month fields to student_payments table
ALTER TABLE student_payments 
ADD COLUMN service_month VARCHAR(7) NOT NULL DEFAULT '2024-01' AFTER payment_date;

ALTER TABLE student_payments 
ADD COLUMN service_period_start DATE AFTER service_month;

ALTER TABLE student_payments 
ADD COLUMN service_period_end DATE AFTER service_period_start;

-- Add index for service_month queries
CREATE INDEX idx_payments_service_month ON student_payments(service_month);

-- Add index for service period queries
CREATE INDEX idx_payments_service_period ON student_payments(service_period_start, service_period_end);
