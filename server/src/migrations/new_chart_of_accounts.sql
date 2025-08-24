-- Fresh Chart of Accounts - Global Structure

-- Step 1: Drop foreign key constraints that reference chart_of_accounts
-- Note: These statements may fail if constraints don't exist, but that's okay
ALTER TABLE transaction_rules 
DROP FOREIGN KEY transaction_rules_ibfk_1;

ALTER TABLE transaction_rules 
DROP FOREIGN KEY transaction_rules_ibfk_2;

ALTER TABLE journal_entries 
DROP FOREIGN KEY journal_entries_ibfk_2;

ALTER TABLE petty_cash_replenishments 
DROP FOREIGN KEY petty_cash_replenishments_ibfk_3;

ALTER TABLE account_migration_mapping 
DROP FOREIGN KEY account_migration_mapping_ibfk_1;

-- Step 2: Drop existing chart of accounts table if it exists
DROP TABLE IF EXISTS chart_of_accounts;

-- Step 3: Create new global chart of accounts table
CREATE TABLE chart_of_accounts (
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

-- Step 4: Insert the new chart of accounts with CBZ accounts
INSERT INTO chart_of_accounts (code, name, type, is_category, parent_id, created_by, created_at, updated_at) VALUES
-- Assets (10000-19999)
('10001', 'Petty Cash', 'Asset', false, NULL, 1, NOW(), NOW()),
('10002', 'Cash', 'Asset', false, NULL, 1, NOW(), NOW()),
('10003', 'CBZ Bank Account', 'Asset', false, NULL, 1, NOW(), NOW()),
('10004', 'CBZ Vault', 'Asset', false, NULL, 1, NOW(), NOW()),
('10005', 'Accounts Receivable', 'Asset', false, NULL, 1, NOW(), NOW()),
('10006', 'Prepaid Expenses', 'Asset', false, NULL, 1, NOW(), NOW()),
('10007', 'Security Deposits', 'Asset', false, NULL, 1, NOW(), NOW()),

-- Liabilities (20000-29999)
('20001', 'Accounts Payable', 'Liability', false, NULL, 1, NOW(), NOW()),
('20002', 'Accrued Expenses', 'Liability', false, NULL, 1, NOW(), NOW()),
('20003', 'Security Deposits Payable', 'Liability', false, NULL, 1, NOW(), NOW()),

-- Equity (30000-39999)
('30001', 'Owner\'s Equity', 'Equity', false, NULL, 1, NOW(), NOW()),
('30002', 'Retained Earnings', 'Equity', false, NULL, 1, NOW(), NOW()),

-- Revenue (40000-49999)
('40001', 'Rentals Income', 'Revenue', false, NULL, 1, NOW(), NOW()),
('40002', 'Other Income', 'Revenue', false, NULL, 1, NOW(), NOW()),
('40003', 'Late Fees Income', 'Revenue', false, NULL, 1, NOW(), NOW()),
('40004', 'Administrative Fees', 'Revenue', false, NULL, 1, NOW(), NOW()),

-- Expenses (50000-59999)
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
('50025', 'Depreciation - Motor Vehicles', 'Expense', false, NULL, 1, NOW(), NOW()),
('50026', 'Insurance', 'Expense', false, NULL, 1, NOW(), NOW()),
('50027', 'Property Taxes', 'Expense', false, NULL, 1, NOW(), NOW()),
('50028', 'Bank Charges', 'Expense', false, NULL, 1, NOW(), NOW()),
('50029', 'Office Supplies', 'Expense', false, NULL, 1, NOW(), NOW()),
('50030', 'Cleaning Supplies', 'Expense', false, NULL, 1, NOW(), NOW());

-- Step 5: Re-add foreign key constraints to reference the new chart_of_accounts table
ALTER TABLE transaction_rules 
ADD CONSTRAINT transaction_rules_ibfk_1 
FOREIGN KEY (debit_account_id) REFERENCES chart_of_accounts(id),
ADD CONSTRAINT transaction_rules_ibfk_2 
FOREIGN KEY (credit_account_id) REFERENCES chart_of_accounts(id);

ALTER TABLE journal_entries 
ADD CONSTRAINT journal_entries_ibfk_2 
FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id);

ALTER TABLE petty_cash_replenishments 
ADD CONSTRAINT petty_cash_replenishments_ibfk_3 
FOREIGN KEY (source_account_id) REFERENCES chart_of_accounts(id);
