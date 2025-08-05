-- Drop existing tables if they exist
DROP TABLE IF EXISTS journal_entries;
DROP TABLE IF EXISTS transactions;

-- Create updated transactions table
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_type VARCHAR(50) NOT NULL,
    transaction_date DATE NOT NULL,
    reference VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    student_id INT NULL,
    boarding_house_id INT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    status ENUM('draft', 'posted', 'voided') DEFAULT 'posted',
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (boarding_house_id) REFERENCES boarding_houses(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create journal entries table
CREATE TABLE journal_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT NOT NULL,
    account_id INT NOT NULL,
    entry_type ENUM('debit', 'credit') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts_branch(id)
);

-- Add status column to transactions if not exists
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS status ENUM('draft', 'posted', 'voided') DEFAULT 'posted' AFTER deleted_at;

-- Create view for account balances
CREATE OR REPLACE VIEW account_balances AS
SELECT 
    coa.id AS account_id,
    coa.code AS account_code,
    coa.name AS account_name,
    coa.type AS account_type,
    coa.branch_id,
    COALESCE(
        SUM(
            CASE 
                WHEN je.entry_type = 'debit' AND coa.type IN ('Asset', 'Expense') THEN je.amount
                WHEN je.entry_type = 'credit' AND coa.type IN ('Asset', 'Expense') THEN -je.amount
                WHEN je.entry_type = 'credit' AND coa.type IN ('Liability', 'Equity', 'Revenue') THEN je.amount
                WHEN je.entry_type = 'debit' AND coa.type IN ('Liability', 'Equity', 'Revenue') THEN -je.amount
            END
        ), 
        0
    ) AS balance
FROM chart_of_accounts_branch coa
LEFT JOIN journal_entries je ON coa.id = je.account_id
LEFT JOIN transactions t ON je.transaction_id = t.id 
    AND t.status = 'posted' 
    AND t.deleted_at IS NULL
WHERE coa.deleted_at IS NULL
GROUP BY coa.id, coa.code, coa.name, coa.type, coa.branch_id; 