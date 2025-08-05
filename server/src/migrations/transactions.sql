-- Transactions table to store transaction headers
CREATE TABLE IF NOT EXISTS transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_date DATE NOT NULL,
    posting_date DATE NOT NULL,
    reference_no VARCHAR(50) NOT NULL,
    description TEXT,
    status ENUM('draft', 'posted', 'voided') DEFAULT 'draft',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Journal entries table to store transaction details/lines
CREATE TABLE IF NOT EXISTS journal_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT NOT NULL,
    account_id INT NOT NULL,
    debit DECIMAL(15,2) DEFAULT 0.00,
    credit DECIMAL(15,2) DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    CHECK (debit >= 0 AND credit >= 0),
    CHECK (
        (debit = 0 AND credit > 0) OR 
        (credit = 0 AND debit > 0)
    )
);

-- Account balances view for efficient balance lookups
CREATE OR REPLACE VIEW account_balances AS
SELECT 
    coa.id AS account_id,
    coa.code AS account_code,
    coa.name AS account_name,
    coa.type AS account_type,
    COALESCE(
        CASE 
            WHEN coa.type IN ('Asset', 'Expense') 
            THEN SUM(COALESCE(je.debit, 0) - COALESCE(je.credit, 0))
            ELSE SUM(COALESCE(je.credit, 0) - COALESCE(je.debit, 0))
        END, 
        0
    ) AS balance
FROM chart_of_accounts coa
LEFT JOIN journal_entries je ON coa.id = je.account_id
LEFT JOIN transactions t ON je.transaction_id = t.id 
    AND t.status = 'posted' 
    AND t.deleted_at IS NULL
WHERE coa.deleted_at IS NULL
GROUP BY coa.id, coa.code, coa.name, coa.type; 