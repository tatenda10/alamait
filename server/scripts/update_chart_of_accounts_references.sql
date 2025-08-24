-- Update foreign key constraints to use the new global chart_of_accounts table
-- This script will update all tables that reference chart_of_accounts_branch to use chart_of_accounts instead

-- Step 1: Drop existing foreign key constraints
ALTER TABLE expenses 
DROP FOREIGN KEY expenses_ibfk_2;

ALTER TABLE journal_entries 
DROP FOREIGN KEY journal_entries_ibfk_2;

ALTER TABLE transaction_rules 
DROP FOREIGN KEY transaction_rules_ibfk_1;

ALTER TABLE transaction_rules 
DROP FOREIGN KEY transaction_rules_ibfk_2;

ALTER TABLE petty_cash_replenishments 
DROP FOREIGN KEY petty_cash_replenishments_ibfk_3;

-- Step 2: Add new foreign key constraints referencing chart_of_accounts
ALTER TABLE expenses 
ADD CONSTRAINT expenses_ibfk_2 
FOREIGN KEY (expense_account_id) REFERENCES chart_of_accounts(id);

ALTER TABLE journal_entries 
ADD CONSTRAINT journal_entries_ibfk_2 
FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id);

ALTER TABLE transaction_rules 
ADD CONSTRAINT transaction_rules_ibfk_1 
FOREIGN KEY (debit_account_id) REFERENCES chart_of_accounts(id);

ALTER TABLE transaction_rules 
ADD CONSTRAINT transaction_rules_ibfk_2 
FOREIGN KEY (credit_account_id) REFERENCES chart_of_accounts(id);

ALTER TABLE petty_cash_replenishments 
ADD CONSTRAINT petty_cash_replenishments_ibfk_3 
FOREIGN KEY (source_account_id) REFERENCES chart_of_accounts(id);

-- Step 3: Update any existing data to use the new account IDs
-- This assumes that the account codes are the same between the old and new systems
UPDATE expenses e
JOIN chart_of_accounts_branch coab ON e.expense_account_id = coab.id
JOIN chart_of_accounts coa ON coab.code = coa.code
SET e.expense_account_id = coa.id
WHERE coab.deleted_at IS NULL AND coa.deleted_at IS NULL;

UPDATE journal_entries je
JOIN chart_of_accounts_branch coab ON je.account_id = coab.id
JOIN chart_of_accounts coa ON coab.code = coa.code
SET je.account_id = coa.id
WHERE coab.deleted_at IS NULL AND coa.deleted_at IS NULL;

UPDATE transaction_rules tr
JOIN chart_of_accounts_branch coab ON tr.debit_account_id = coab.id
JOIN chart_of_accounts coa ON coab.code = coa.code
SET tr.debit_account_id = coa.id
WHERE coab.deleted_at IS NULL AND coa.deleted_at IS NULL;

UPDATE transaction_rules tr
JOIN chart_of_accounts_branch coab ON tr.credit_account_id = coab.id
JOIN chart_of_accounts coa ON coab.code = coa.code
SET tr.credit_account_id = coa.id
WHERE coab.deleted_at IS NULL AND coa.deleted_at IS NULL;

UPDATE petty_cash_replenishments pcr
JOIN chart_of_accounts_branch coab ON pcr.source_account_id = coab.id
JOIN chart_of_accounts coa ON coab.code = coa.code
SET pcr.source_account_id = coa.id
WHERE coab.deleted_at IS NULL AND coa.deleted_at IS NULL;

-- Step 4: Verify the updates
SELECT 'expenses' as table_name, COUNT(*) as updated_count FROM expenses;
SELECT 'journal_entries' as table_name, COUNT(*) as updated_count FROM journal_entries;
SELECT 'transaction_rules' as table_name, COUNT(*) as updated_count FROM transaction_rules;
SELECT 'petty_cash_replenishments' as table_name, COUNT(*) as updated_count FROM petty_cash_replenishments;

-- Step 5: Optional: Drop the old chart_of_accounts_branch table after verifying everything works
-- DROP TABLE IF EXISTS chart_of_accounts_branch;
