-- Account Balance Tracking and Reconciliation System

-- Create account balance history table to track balance changes over time
CREATE TABLE IF NOT EXISTS account_balance_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    transaction_date DATE NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    closing_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_debits DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_credits DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    transaction_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    INDEX idx_account_date (account_id, transaction_date),
    INDEX idx_transaction_date (transaction_date)
);

-- Create account reconciliation table
CREATE TABLE IF NOT EXISTS account_reconciliations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    reconciliation_date DATE NOT NULL,
    book_balance DECIMAL(15,2) NOT NULL,
    bank_balance DECIMAL(15,2) NOT NULL,
    difference DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status ENUM('pending', 'reconciled', 'unreconciled') DEFAULT 'pending',
    notes TEXT,
    reconciled_by INT,
    reconciled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (reconciled_by) REFERENCES users(id),
    UNIQUE KEY unique_account_date (account_id, reconciliation_date)
);

-- Create reconciliation items table for tracking individual items
CREATE TABLE IF NOT EXISTS reconciliation_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reconciliation_id INT NOT NULL,
    transaction_id INT,
    journal_entry_id INT,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    entry_type ENUM('debit', 'credit') NOT NULL,
    transaction_date DATE NOT NULL,
    is_reconciled BOOLEAN DEFAULT false,
    bank_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reconciliation_id) REFERENCES account_reconciliations(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id)
);

-- Create a view for current account balances
CREATE OR REPLACE VIEW current_account_balances AS
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
    COUNT(DISTINCT je.transaction_id) AS transaction_count,
    MAX(t.transaction_date) AS last_transaction_date
FROM chart_of_accounts coa
LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
LEFT JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL AND t.status = 'posted'
WHERE coa.deleted_at IS NULL
GROUP BY coa.id, coa.code, coa.name, coa.type;

-- Create a view for account transaction history (like your ledger)
CREATE OR REPLACE VIEW account_transaction_ledger AS
SELECT 
    coa.id AS account_id,
    coa.code AS account_code,
    coa.name AS account_name,
    t.transaction_date,
    t.reference,
    t.description,
    je.entry_type,
    je.amount,
    CASE 
        WHEN je.entry_type = 'credit' THEN je.amount
        ELSE 0
    END AS credit_amount,
    CASE 
        WHEN je.entry_type = 'debit' THEN je.amount
        ELSE 0
    END AS debit_amount,
    SUM(
        CASE 
            WHEN coa.type IN ('Asset', 'Expense') AND je2.entry_type = 'debit' THEN je2.amount
            WHEN coa.type IN ('Asset', 'Expense') AND je2.entry_type = 'credit' THEN -je2.amount
            WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je2.entry_type = 'credit' THEN je2.amount
            WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je2.entry_type = 'debit' THEN -je2.amount
            ELSE 0
        END
    ) OVER (
        PARTITION BY coa.id 
        ORDER BY t.transaction_date, t.id, je.id
        ROWS UNBOUNDED PRECEDING
    ) AS running_balance,
    t.id AS transaction_id,
    je.id AS journal_entry_id
FROM chart_of_accounts coa
JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL AND t.status = 'posted'
LEFT JOIN journal_entries je2 ON coa.id = je2.account_id AND je2.deleted_at IS NULL
LEFT JOIN transactions t2 ON je2.transaction_id = t2.id AND t2.deleted_at IS NULL AND t2.status = 'posted'
WHERE coa.deleted_at IS NULL
ORDER BY coa.id, t.transaction_date, t.id, je.id;

-- Insert initial balance history for existing accounts
INSERT INTO account_balance_history (account_id, transaction_date, opening_balance, closing_balance, total_debits, total_credits, transaction_count)
SELECT 
    cab.account_id,
    CURDATE() as transaction_date,
    0.00 as opening_balance,
    cab.current_balance as closing_balance,
    COALESCE(
        (SELECT SUM(je.amount) 
         FROM journal_entries je 
         JOIN transactions t ON je.transaction_id = t.id 
         WHERE je.account_id = cab.account_id 
           AND je.entry_type = 'debit' 
           AND je.deleted_at IS NULL 
           AND t.deleted_at IS NULL 
           AND t.status = 'posted'), 0
    ) as total_debits,
    COALESCE(
        (SELECT SUM(je.amount) 
         FROM journal_entries je 
         JOIN transactions t ON je.transaction_id = t.id 
         WHERE je.account_id = cab.account_id 
           AND je.entry_type = 'credit' 
           AND je.deleted_at IS NULL 
           AND t.deleted_at IS NULL 
           AND t.status = 'posted'), 0
    ) as total_credits,
    cab.transaction_count
FROM current_account_balances cab
WHERE cab.current_balance != 0 OR cab.transaction_count > 0;
