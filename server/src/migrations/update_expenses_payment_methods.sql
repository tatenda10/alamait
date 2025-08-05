-- Update expenses table to support new payment methods
-- This migration adds 'petty_cash' and 'credit' to the payment_method ENUM

-- First, let's add the new payment methods to the ENUM
ALTER TABLE expenses 
MODIFY COLUMN payment_method ENUM('cash', 'bank_transfer', 'check', 'petty_cash', 'credit') NOT NULL;

-- Also add new columns for payment status tracking
ALTER TABLE expenses 
ADD COLUMN payment_status ENUM('full', 'partial', 'debt') DEFAULT 'full' AFTER payment_method,
ADD COLUMN total_amount DECIMAL(10,2) NULL AFTER payment_status,
ADD COLUMN remaining_balance DECIMAL(10,2) NULL AFTER total_amount,
ADD COLUMN remaining_payment_method ENUM('cash', 'bank_transfer', 'check', 'petty_cash', 'credit') NULL AFTER remaining_balance;

-- Add indexes for better performance
CREATE INDEX idx_expenses_payment_status ON expenses(payment_status);
CREATE INDEX idx_expenses_payment_method ON expenses(payment_method);