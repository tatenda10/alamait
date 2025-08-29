-- Balance Brought Down (BD) and Carried Down (CD) System
-- This system tracks opening and closing balances for each accounting period

-- Create balance periods table to define accounting periods
CREATE TABLE IF NOT EXISTS balance_periods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    period_name VARCHAR(100) NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    closed_at TIMESTAMP NULL,
    closed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (closed_by) REFERENCES users(id),
    UNIQUE KEY unique_period_dates (period_start_date, period_end_date)
);

-- Create account period balances table to track BD/CD for each account per period
CREATE TABLE IF NOT EXISTS account_period_balances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    period_id INT NOT NULL,
    balance_brought_down DECIMAL(15,2) NOT NULL DEFAULT 0.00, -- BD
    balance_carried_down DECIMAL(15,2) NOT NULL DEFAULT 0.00, -- CD
    total_debits DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_credits DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    transaction_count INT NOT NULL DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by INT,
    verified_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (period_id) REFERENCES balance_periods(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    UNIQUE KEY unique_account_period (account_id, period_id),
    INDEX idx_account_id (account_id),
    INDEX idx_period_id (period_id)
);

-- Create balance verification table for audit trail
CREATE TABLE IF NOT EXISTS balance_verifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_period_balance_id INT NOT NULL,
    verified_by INT NOT NULL,
    verification_date DATE NOT NULL,
    previous_balance DECIMAL(15,2) NOT NULL,
    new_balance DECIMAL(15,2) NOT NULL,
    adjustment_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    adjustment_reason TEXT,
    verification_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_period_balance_id) REFERENCES account_period_balances(id),
    FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- Create a view for current period balances with BD/CD
CREATE OR REPLACE VIEW current_period_balances AS
SELECT 
    coa.id AS account_id,
    coa.code AS account_code,
    coa.name AS account_name,
    coa.type AS account_type,
    bp.id AS period_id,
    bp.period_name,
    bp.period_start_date,
    bp.period_end_date,
    apb.balance_brought_down,
    apb.balance_carried_down,
    apb.total_debits,
    apb.total_credits,
    apb.transaction_count,
    apb.is_verified,
    CASE 
        WHEN coa.type IN ('Asset', 'Expense') THEN 
            apb.balance_brought_down + apb.total_debits - apb.total_credits
        WHEN coa.type IN ('Liability', 'Equity', 'Revenue') THEN 
            apb.balance_brought_down + apb.total_credits - apb.total_debits
        ELSE 0
    END AS calculated_balance,
    apb.balance_carried_down AS current_balance
FROM chart_of_accounts coa
CROSS JOIN balance_periods bp
LEFT JOIN account_period_balances apb ON coa.id = apb.account_id AND bp.id = apb.period_id
WHERE coa.deleted_at IS NULL 
  AND bp.is_closed = FALSE
ORDER BY coa.code, bp.period_start_date;

-- Create a view for account ledger with BD/CD
CREATE OR REPLACE VIEW account_ledger_with_bd_cd AS
SELECT 
    coa.id AS account_id,
    coa.code AS account_code,
    coa.name AS account_name,
    coa.type AS account_type,
    bp.period_name,
    bp.period_start_date,
    bp.period_end_date,
    -- BD (Balance Brought Down)
    CASE 
        WHEN ROW_NUMBER() OVER (PARTITION BY coa.id, bp.id ORDER BY t.transaction_date, t.id) = 1 
        THEN apb.balance_brought_down 
        ELSE 0 
    END AS balance_brought_down,
    -- Transaction details
    t.transaction_date,
    t.reference,
    t.description,
    je.entry_type,
    je.amount,
    CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END AS debit_amount,
    CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END AS credit_amount,
    -- Running balance calculation
    CASE 
        WHEN coa.type IN ('Asset', 'Expense') THEN 
            apb.balance_brought_down + 
            SUM(CASE WHEN je2.entry_type = 'debit' THEN je2.amount ELSE 0 END) OVER (
                PARTITION BY coa.id, bp.id 
                ORDER BY t2.transaction_date, t2.id, je2.id 
                ROWS UNBOUNDED PRECEDING
            ) - 
            SUM(CASE WHEN je2.entry_type = 'credit' THEN je2.amount ELSE 0 END) OVER (
                PARTITION BY coa.id, bp.id 
                ORDER BY t2.transaction_date, t2.id, je2.id 
                ROWS UNBOUNDED PRECEDING
            )
        WHEN coa.type IN ('Liability', 'Equity', 'Revenue') THEN 
            apb.balance_brought_down + 
            SUM(CASE WHEN je2.entry_type = 'credit' THEN je2.amount ELSE 0 END) OVER (
                PARTITION BY coa.id, bp.id 
                ORDER BY t2.transaction_date, t2.id, je2.id 
                ROWS UNBOUNDED PRECEDING
            ) - 
            SUM(CASE WHEN je2.entry_type = 'debit' THEN je2.amount ELSE 0 END) OVER (
                PARTITION BY coa.id, bp.id 
                ORDER BY t2.transaction_date, t2.id, je2.id 
                ROWS UNBOUNDED PRECEDING
            )
        ELSE 0
    END AS running_balance,
    -- CD (Balance Carried Down) - only on last transaction of period
    CASE 
        WHEN ROW_NUMBER() OVER (PARTITION BY coa.id, bp.id ORDER BY t.transaction_date DESC, t.id DESC) = 1 
        THEN apb.balance_carried_down 
        ELSE 0 
    END AS balance_carried_down,
    t.id AS transaction_id,
    je.id AS journal_entry_id,
    bp.id AS period_id
FROM chart_of_accounts coa
CROSS JOIN balance_periods bp
LEFT JOIN account_period_balances apb ON coa.id = apb.account_id AND bp.id = apb.period_id
LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
LEFT JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL AND t.status = 'posted'
LEFT JOIN journal_entries je2 ON coa.id = je2.account_id AND je2.deleted_at IS NULL
LEFT JOIN transactions t2 ON je2.transaction_id = t2.id AND t2.deleted_at IS NULL AND t2.status = 'posted'
WHERE coa.deleted_at IS NULL
  AND t.transaction_date BETWEEN bp.period_start_date AND bp.period_end_date
ORDER BY coa.code, bp.period_start_date, t.transaction_date, t.id, je.id;

-- Insert default periods for 2025 (monthly)
INSERT INTO balance_periods (period_name, period_start_date, period_end_date) VALUES
('January 2025', '2025-01-01', '2025-01-31'),
('February 2025', '2025-02-01', '2025-02-28'),
('March 2025', '2025-03-01', '2025-03-31'),
('April 2025', '2025-04-01', '2025-04-30'),
('May 2025', '2025-05-01', '2025-05-31'),
('June 2025', '2025-06-01', '2025-06-30'),
('July 2025', '2025-07-01', '2025-07-31'),
('August 2025', '2025-08-01', '2025-08-31'),
('September 2025', '2025-09-01', '2025-09-30'),
('October 2025', '2025-10-01', '2025-10-31'),
('November 2025', '2025-11-01', '2025-11-30'),
('December 2025', '2025-12-01', '2025-12-31');

-- Initialize account period balances for all accounts and periods
INSERT INTO account_period_balances (account_id, period_id, balance_brought_down, balance_carried_down, total_debits, total_credits, transaction_count)
SELECT 
    coa.id AS account_id,
    bp.id AS period_id,
    0.00 AS balance_brought_down,
    0.00 AS balance_carried_down,
    COALESCE(
        (SELECT SUM(je.amount) 
         FROM journal_entries je 
         JOIN transactions t ON je.transaction_id = t.id 
         WHERE je.account_id = coa.id 
           AND je.entry_type = 'debit' 
           AND je.deleted_at IS NULL 
           AND t.deleted_at IS NULL 
           AND t.status = 'posted'
           AND t.transaction_date BETWEEN bp.period_start_date AND bp.period_end_date), 0
    ) AS total_debits,
    COALESCE(
        (SELECT SUM(je.amount) 
         FROM journal_entries je 
         JOIN transactions t ON je.transaction_id = t.id 
         WHERE je.account_id = coa.id 
           AND je.entry_type = 'credit' 
           AND je.deleted_at IS NULL 
           AND t.deleted_at IS NULL 
           AND t.status = 'posted'
           AND t.transaction_date BETWEEN bp.period_start_date AND bp.period_end_date), 0
    ) AS total_credits,
    COALESCE(
        (SELECT COUNT(DISTINCT t.id) 
         FROM journal_entries je 
         JOIN transactions t ON je.transaction_id = t.id 
         WHERE je.account_id = coa.id 
           AND je.deleted_at IS NULL 
           AND t.deleted_at IS NULL 
           AND t.status = 'posted'
           AND t.transaction_date BETWEEN bp.period_start_date AND bp.period_end_date), 0
    ) AS transaction_count
FROM chart_of_accounts coa
CROSS JOIN balance_periods bp
WHERE coa.deleted_at IS NULL
ON DUPLICATE KEY UPDATE
    total_debits = VALUES(total_debits),
    total_credits = VALUES(total_credits),
    transaction_count = VALUES(transaction_count),
    updated_at = CURRENT_TIMESTAMP;

-- Update carried down balances based on calculated balances
UPDATE account_period_balances apb
JOIN chart_of_accounts coa ON apb.account_id = coa.id
SET apb.balance_carried_down = 
    CASE 
        WHEN coa.type IN ('Asset', 'Expense') THEN 
            apb.balance_brought_down + apb.total_debits - apb.total_credits
        WHEN coa.type IN ('Liability', 'Equity', 'Revenue') THEN 
            apb.balance_brought_down + apb.total_credits - apb.total_debits
        ELSE 0
    END,
    apb.updated_at = CURRENT_TIMESTAMP; 