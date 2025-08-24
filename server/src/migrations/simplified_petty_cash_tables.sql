-- Simplified Petty Cash Management Tables

-- Petty Cash Accounts - One account per boarding house
CREATE TABLE IF NOT EXISTS petty_cash_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    boarding_house_id INT NOT NULL,
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    beginning_balance DECIMAL(15,2) DEFAULT 0.00,
    total_inflows DECIMAL(15,2) DEFAULT 0.00,
    total_outflows DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (boarding_house_id) REFERENCES boarding_houses(id),
    UNIQUE KEY unique_boarding_house (boarding_house_id),
    INDEX idx_boarding_house (boarding_house_id)
);

-- Petty Cash Transactions - Track all petty cash movements
CREATE TABLE IF NOT EXISTS petty_cash_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    boarding_house_id INT NOT NULL,
    transaction_type ENUM('cash_inflow', 'cash_outflow', 'withdrawal', 'expense', 'student_payment', 'beginning_balance') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    transaction_date DATE NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (boarding_house_id) REFERENCES boarding_houses(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_boarding_house (boarding_house_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_created_by (created_by)
);

-- Insert initial petty cash accounts for existing boarding houses
INSERT IGNORE INTO petty_cash_accounts (boarding_house_id, current_balance, beginning_balance, total_inflows, total_outflows)
SELECT id, 0.00, 0.00, 0.00, 0.00 FROM boarding_houses;
