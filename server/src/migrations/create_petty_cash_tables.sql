-- Petty Cash Management Tables

-- Petty Cash Accounts - Individual accounts for designated users
CREATE TABLE IF NOT EXISTS petty_cash_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_name VARCHAR(255) NOT NULL,
    account_code VARCHAR(20) NOT NULL,
    assigned_user_id INT NOT NULL,
    boarding_house_id INT NOT NULL,
    initial_balance DECIMAL(15,2) DEFAULT 0.00,
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (assigned_user_id) REFERENCES users(id),
    FOREIGN KEY (boarding_house_id) REFERENCES boarding_houses(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_account_code_boarding_house (account_code, boarding_house_id, deleted_at),
    INDEX idx_assigned_user (assigned_user_id),
    INDEX idx_boarding_house (boarding_house_id)
);

-- Petty Cash Issuances - Track cash issued to petty cash accounts
CREATE TABLE IF NOT EXISTS petty_cash_issuances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    petty_cash_account_id INT NOT NULL,
    transaction_id INT,
    amount DECIMAL(15,2) NOT NULL,
    issuance_date DATE NOT NULL,
    issued_by INT NOT NULL,
    reference_number VARCHAR(50),
    purpose TEXT,
    notes TEXT,
    status ENUM('pending', 'approved', 'issued', 'cancelled') DEFAULT 'pending',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (petty_cash_account_id) REFERENCES petty_cash_accounts(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (issued_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_petty_cash_account (petty_cash_account_id),
    INDEX idx_issuance_date (issuance_date),
    INDEX idx_status (status)
);

-- Petty Cash Expenses - Track expenses made from petty cash
CREATE TABLE IF NOT EXISTS petty_cash_expenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    petty_cash_account_id INT NOT NULL,
    transaction_id INT,
    expense_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    expense_category VARCHAR(255),
    expense_account_id INT,
    vendor_name VARCHAR(255),
    receipt_number VARCHAR(100),
    receipt_path VARCHAR(500),
    receipt_original_name VARCHAR(255),
    notes TEXT,
    status ENUM('pending', 'approved', 'posted', 'rejected') DEFAULT 'pending',
    submitted_by INT NOT NULL,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (petty_cash_account_id) REFERENCES petty_cash_accounts(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (expense_account_id) REFERENCES chart_of_accounts_branch(id),
    FOREIGN KEY (submitted_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_petty_cash_account (petty_cash_account_id),
    INDEX idx_expense_date (expense_date),
    INDEX idx_status (status),
    INDEX idx_submitted_by (submitted_by)
);

-- Petty Cash Reconciliations - Track reconciliation activities
CREATE TABLE IF NOT EXISTS petty_cash_reconciliations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    petty_cash_account_id INT NOT NULL,
    reconciliation_date DATE NOT NULL,
    book_balance DECIMAL(15,2) NOT NULL,
    physical_count DECIMAL(15,2) NOT NULL,
    variance DECIMAL(15,2) GENERATED ALWAYS AS (physical_count - book_balance) STORED,
    variance_explanation TEXT,
    reconciled_by INT NOT NULL,
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    status ENUM('pending', 'reviewed', 'approved', 'rejected') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (petty_cash_account_id) REFERENCES petty_cash_accounts(id),
    FOREIGN KEY (reconciled_by) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    INDEX idx_petty_cash_account (petty_cash_account_id),
    INDEX idx_reconciliation_date (reconciliation_date),
    INDEX idx_status (status)
);

-- Petty Cash Replenishments - Track when petty cash is replenished
CREATE TABLE IF NOT EXISTS petty_cash_replenishments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    petty_cash_account_id INT NOT NULL,
    transaction_id INT,
    replenishment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    source_account_id INT NOT NULL, -- Usually main cash or bank account
    reference_number VARCHAR(50),
    purpose TEXT,
    requested_by INT NOT NULL,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    status ENUM('pending', 'approved', 'completed', 'rejected') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (petty_cash_account_id) REFERENCES petty_cash_accounts(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (source_account_id) REFERENCES chart_of_accounts_branch(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_petty_cash_account (petty_cash_account_id),
    INDEX idx_replenishment_date (replenishment_date),
    INDEX idx_status (status)
);

-- Insert default petty cash account in Chart of Accounts if not exists
INSERT IGNORE INTO chart_of_accounts_branch (code, name, type, is_category, branch_id, created_by, created_at, updated_at)
SELECT '10001', 'Petty Cash', 'Asset', false, bh.id, 1, NOW(), NOW()
FROM boarding_houses bh
WHERE NOT EXISTS (
    SELECT 1 FROM chart_of_accounts_branch 
    WHERE code = '10001' AND branch_id = bh.id AND deleted_at IS NULL
);