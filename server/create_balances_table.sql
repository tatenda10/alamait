-- Create current_account_balances table
CREATE TABLE current_account_balances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense') NOT NULL,
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_debits DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_credits DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    transaction_count INT NOT NULL DEFAULT 0,
    last_transaction_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    UNIQUE KEY unique_account (account_id),
    INDEX idx_account_code (account_code),
    INDEX idx_account_type (account_type)
);

-- Insert initial data for all accounts
INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
SELECT 
    coa.id AS account_id,
    coa.code AS account_code,
    coa.name AS account_name,
    coa.type AS account_type,
    COALESCE(
        SUM(
            CASE 
                WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'debit' THEN je.amount
                WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'credit' THEN -je.amount
                WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'credit' THEN je.amount
                WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'debit' THEN -je.amount
                ELSE 0
            END
        ), 0
    ) AS current_balance,
    COALESCE(
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0
    ) AS total_debits,
    COALESCE(
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0
    ) AS total_credits,
    COUNT(DISTINCT je.transaction_id) AS transaction_count,
    MAX(t.transaction_date) AS last_transaction_date
FROM chart_of_accounts coa
LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
LEFT JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL AND t.status = 'posted'
WHERE coa.deleted_at IS NULL
GROUP BY coa.id, coa.code, coa.name, coa.type;
