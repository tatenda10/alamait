-- Bank Reconciliation Tables

-- Bank Statements - Store uploaded bank statements
CREATE TABLE IF NOT EXISTS bank_statements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    statement_date DATE NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL,
    closing_balance DECIMAL(15,2) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_account_date (account_id, statement_date),
    INDEX idx_uploaded_by (uploaded_by)
);

-- Bank Statement Items - Individual transactions from bank statements
CREATE TABLE IF NOT EXISTS bank_statement_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    statement_id INT NOT NULL,
    bank_date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    reference VARCHAR(100),
    debit_amount DECIMAL(15,2) DEFAULT 0.00,
    credit_amount DECIMAL(15,2) DEFAULT 0.00,
    balance DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (statement_id) REFERENCES bank_statements(id),
    INDEX idx_statement_id (statement_id),
    INDEX idx_bank_date (bank_date)
);

-- Bank Reconciliations - Main reconciliation records
CREATE TABLE IF NOT EXISTS bank_reconciliations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    reconciliation_date DATE NOT NULL,
    book_balance DECIMAL(15,2) NOT NULL,
    bank_balance DECIMAL(15,2) NOT NULL,
    difference DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    statement_id INT,
    status ENUM('pending', 'reconciled', 'unreconciled') DEFAULT 'pending',
    notes TEXT,
    created_by INT NOT NULL,
    reconciled_by INT,
    reconciled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (statement_id) REFERENCES bank_statements(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (reconciled_by) REFERENCES users(id),
    UNIQUE KEY unique_account_date (account_id, reconciliation_date),
    INDEX idx_account_date (account_id, reconciliation_date),
    INDEX idx_status (status)
);

-- Bank Reconciliation Items - Individual items for matching
CREATE TABLE IF NOT EXISTS bank_reconciliation_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reconciliation_id INT NOT NULL,
    transaction_id INT,
    journal_entry_id INT,
    statement_item_id INT,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    entry_type ENUM('debit', 'credit') NOT NULL,
    transaction_date DATE NOT NULL,
    is_reconciled BOOLEAN DEFAULT false,
    matched_with INT,
    matched_at TIMESTAMP NULL,
    bank_reference VARCHAR(100),
    bank_date DATE,
    bank_amount DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reconciliation_id) REFERENCES bank_reconciliations(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
    FOREIGN KEY (statement_item_id) REFERENCES bank_statement_items(id),
    FOREIGN KEY (matched_with) REFERENCES bank_reconciliation_items(id),
    INDEX idx_reconciliation_id (reconciliation_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_statement_item_id (statement_item_id),
    INDEX idx_is_reconciled (is_reconciled)
);

-- Create uploads directory for bank statements
-- Note: This is handled by the application, not SQL
