-- Add 'withdrawal' to the transaction_type ENUM in petty_cash_transactions table
-- This allows for cash reduction operations that are not business expenses

ALTER TABLE petty_cash_transactions 
MODIFY COLUMN transaction_type ENUM('expense', 'replenishment', 'transfer', 'withdrawal') NOT NULL;