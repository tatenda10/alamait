-- Add petty_cash_user_id column to petty_cash_accounts table
ALTER TABLE petty_cash_accounts 
ADD COLUMN petty_cash_user_id INT NULL AFTER user_id;

-- Add index for the new column
ALTER TABLE petty_cash_accounts 
ADD INDEX idx_petty_cash_user_id (petty_cash_user_id);

-- Add foreign key constraint
ALTER TABLE petty_cash_accounts 
ADD CONSTRAINT fk_petty_cash_accounts_user 
FOREIGN KEY (petty_cash_user_id) REFERENCES petty_cash_users(id);
