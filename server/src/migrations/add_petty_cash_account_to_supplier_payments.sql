-- Add petty_cash_account_id column to supplier_payments table
ALTER TABLE supplier_payments 
ADD COLUMN petty_cash_account_id INT NULL AFTER payment_method,
ADD INDEX idx_supplier_payments_petty_cash (petty_cash_account_id),
ADD FOREIGN KEY (petty_cash_account_id) REFERENCES petty_cash_accounts(id) ON DELETE SET NULL;

-- Update payment_method enum to include petty_cash
ALTER TABLE supplier_payments 
MODIFY COLUMN payment_method ENUM('cash', 'petty_cash', 'bank_transfer', 'check', 'mobile_money', 'other') DEFAULT 'cash';