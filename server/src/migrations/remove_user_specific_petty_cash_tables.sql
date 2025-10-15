-- Remove user-specific petty cash tables
-- This migration removes the user-specific petty cash system

-- Drop user-specific petty cash tables
DROP TABLE IF EXISTS petty_cash_users;
DROP TABLE IF EXISTS petty_cash_balances;

-- Note: petty_cash_transactions table will be modified in the next migration
-- to work with user-specific accounts instead of boarding house specific
