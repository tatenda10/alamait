-- Restructure Chart of Accounts from per-boarding-house to global
-- This migration will create a new global chart of accounts and migrate existing data

-- Step 1: Create new global chart of accounts table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense') NOT NULL,
    is_category BOOLEAN DEFAULT false,
    parent_id INT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (parent_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_code (code, deleted_at),
    UNIQUE KEY unique_name_under_parent (name, parent_id, deleted_at)
);

-- Step 2: Insert the new CBZ accounts and other standard accounts
INSERT INTO chart_of_accounts (code, name, type, is_category, parent_id, created_by, created_at, updated_at) VALUES
-- Assets
('10001', 'Petty Cash', 'Asset', false, NULL, 1, NOW(), NOW()),
('10002', 'Cash', 'Asset', false, NULL, 1, NOW(), NOW()),
('10003', 'CBZ Bank Account', 'Asset', false, NULL, 1, NOW(), NOW()),
('10004', 'CBZ Vault', 'Asset', false, NULL, 1, NOW(), NOW()),
('10005', 'Accounts Receivable', 'Asset', false, NULL, 1, NOW(), NOW()),

-- Liabilities
('20001', 'Accounts Payable', 'Liability', false, NULL, 1, NOW(), NOW()),

-- Revenue
('40001', 'Rentals Income', 'Revenue', false, NULL, 1, NOW(), NOW()),
('40002', 'Other Income', 'Revenue', false, NULL, 1, NOW(), NOW()),

-- Expenses
('50001', 'Repairs and Maintenance', 'Expense', false, NULL, 1, NOW(), NOW()),
('50002', 'Utilities - Water', 'Expense', false, NULL, 1, NOW(), NOW()),
('50003', 'Utilities - Electricity', 'Expense', false, NULL, 1, NOW(), NOW()),
('50004', 'Bulk Water', 'Expense', false, NULL, 1, NOW(), NOW()),
('50005', 'Car Running', 'Expense', false, NULL, 1, NOW(), NOW()),
('50006', 'Car Maintenance and Repair', 'Expense', false, NULL, 1, NOW(), NOW()),
('50007', 'Gas Filling', 'Expense', false, NULL, 1, NOW(), NOW()),
('50008', 'Communication Cost', 'Expense', false, NULL, 1, NOW(), NOW()),
('50009', 'Sanitary', 'Expense', false, NULL, 1, NOW(), NOW()),
('50010', 'House Keeping', 'Expense', false, NULL, 1, NOW(), NOW()),
('50011', 'Security Costs', 'Expense', false, NULL, 1, NOW(), NOW()),
('50012', 'Property Management Salaries', 'Expense', false, NULL, 1, NOW(), NOW()),
('50013', 'Administrative Expenses', 'Expense', false, NULL, 1, NOW(), NOW()),
('50014', 'Marketing Expenses', 'Expense', false, NULL, 1, NOW(), NOW()),
('50015', 'Staff Salaries & Wages', 'Expense', false, NULL, 1, NOW(), NOW()),
('50016', 'Staff Welfare', 'Expense', false, NULL, 1, NOW(), NOW()),
('50017', 'Depreciation - Buildings', 'Expense', false, NULL, 1, NOW(), NOW()),
('50018', 'Professional Fees (Legal, Audit)', 'Expense', false, NULL, 1, NOW(), NOW()),
('50019', 'Waste Management', 'Expense', false, NULL, 1, NOW(), NOW()),
('50020', 'Medical Aid', 'Expense', false, NULL, 1, NOW(), NOW()),
('50021', 'Advertising', 'Expense', false, NULL, 1, NOW(), NOW()),
('50022', 'Family Expenses', 'Expense', false, NULL, 1, NOW(), NOW()),
('50023', 'House Association Fees', 'Expense', false, NULL, 1, NOW(), NOW()),
('50024', 'Licenses', 'Expense', false, NULL, 1, NOW(), NOW()),
('50025', 'Depreciation - Motor Vehicles', 'Expense', false, NULL, 1, NOW(), NOW());

-- Step 3: Update journal_entries table to reference the new chart_of_accounts
ALTER TABLE journal_entries 
DROP FOREIGN KEY IF EXISTS journal_entries_ibfk_2;

ALTER TABLE journal_entries 
ADD CONSTRAINT journal_entries_ibfk_2 
FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id);

-- Step 4: Update transaction_rules table to reference the new chart_of_accounts
ALTER TABLE transaction_rules 
DROP FOREIGN KEY IF EXISTS transaction_rules_ibfk_1,
DROP FOREIGN KEY IF EXISTS transaction_rules_ibfk_2;

ALTER TABLE transaction_rules 
ADD CONSTRAINT transaction_rules_ibfk_1 
FOREIGN KEY (debit_account_id) REFERENCES chart_of_accounts(id),
ADD CONSTRAINT transaction_rules_ibfk_2 
FOREIGN KEY (credit_account_id) REFERENCES chart_of_accounts(id);

-- Step 5: Update petty_cash_replenishments table to reference the new chart_of_accounts
ALTER TABLE petty_cash_replenishments 
DROP FOREIGN KEY IF EXISTS petty_cash_replenishments_ibfk_3;

ALTER TABLE petty_cash_replenishments 
ADD CONSTRAINT petty_cash_replenishments_ibfk_3 
FOREIGN KEY (source_account_id) REFERENCES chart_of_accounts(id);

-- Step 6: Create a mapping table to track which accounts from the old system map to the new system
CREATE TABLE IF NOT EXISTS account_migration_mapping (
    id INT PRIMARY KEY AUTO_INCREMENT,
    old_account_id INT NOT NULL,
    old_branch_id INT NOT NULL,
    new_account_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (new_account_id) REFERENCES chart_of_accounts(id)
);

-- Step 7: Migrate existing journal entries to use the new account IDs
-- This will map the most common accounts based on their codes
INSERT INTO account_migration_mapping (old_account_id, old_branch_id, new_account_id)
SELECT 
    coab.id as old_account_id,
    coab.branch_id as old_branch_id,
    coa.id as new_account_id
FROM chart_of_accounts_branch coab
JOIN chart_of_accounts coa ON coab.code = coa.code
WHERE coab.deleted_at IS NULL AND coa.deleted_at IS NULL;

-- Step 8: Update journal entries to use new account IDs
UPDATE journal_entries je
JOIN account_migration_mapping amm ON je.account_id = amm.old_account_id
SET je.account_id = amm.new_account_id
WHERE je.deleted_at IS NULL;

-- Step 9: Update transaction rules to use new account IDs
UPDATE transaction_rules tr
JOIN account_migration_mapping amm ON tr.debit_account_id = amm.old_account_id
SET tr.debit_account_id = amm.new_account_id
WHERE tr.deleted_at IS NULL;

UPDATE transaction_rules tr
JOIN account_migration_mapping amm ON tr.credit_account_id = amm.old_account_id
SET tr.credit_account_id = amm.new_account_id
WHERE tr.deleted_at IS NULL;

-- Step 10: Update petty cash replenishments to use new account IDs
UPDATE petty_cash_replenishments pcr
JOIN account_migration_mapping amm ON pcr.source_account_id = amm.old_account_id
SET pcr.source_account_id = amm.new_account_id
WHERE pcr.deleted_at IS NULL;

-- Step 11: Create new account balances view for the global chart of accounts
CREATE OR REPLACE VIEW account_balances AS
SELECT 
    coa.id AS account_id,
    coa.code AS account_code,
    coa.name AS account_name,
    coa.type AS account_type,
    COALESCE(
        CASE 
            WHEN coa.type IN ('Asset', 'Expense') 
            THEN SUM(COALESCE(je.amount, 0))
            ELSE SUM(COALESCE(je.amount, 0))
        END, 
        0
    ) AS balance
FROM chart_of_accounts coa
LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.entry_type = 'debit'
LEFT JOIN transactions t ON je.transaction_id = t.id 
WHERE (t.deleted_at IS NULL OR t.id IS NULL)
  AND (t.status = 'posted' OR t.id IS NULL)
GROUP BY coa.id, coa.code, coa.name, coa.type;

-- Step 12: Drop the old chart_of_accounts_branch table (after ensuring all data is migrated)
-- Note: This should be done carefully after verifying all data has been migrated correctly
-- DROP TABLE IF EXISTS chart_of_accounts_branch;
