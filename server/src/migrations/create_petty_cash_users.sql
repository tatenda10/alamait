-- Petty Cash Users Table
-- This table stores users who can access the petty cash application

CREATE TABLE IF NOT EXISTS petty_cash_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    employee_id VARCHAR(50),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_employee_id (employee_id)
);

-- Insert sample petty cash users
INSERT IGNORE INTO petty_cash_users (username, email, password_hash, full_name, phone, department, employee_id, created_by) VALUES
('pettycash_admin', 'admin@pettycash.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Petty Cash Administrator', '+1234567890', 'Finance', 'PC001', 1),
('cashier_001', 'cashier1@company.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Doe', '+1234567891', 'Operations', 'PC002', 1),
('cashier_002', 'cashier2@company.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Smith', '+1234567892', 'Maintenance', 'PC003', 1),
('cashier_003', 'cashier3@company.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike Johnson', '+1234567893', 'Security', 'PC004', 1);

-- Petty Cash Transactions Table (Updated to use petty_cash_users)
-- This table tracks all petty cash transactions made by petty cash users

CREATE TABLE IF NOT EXISTS petty_cash_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    petty_cash_user_id INT NOT NULL,
    boarding_house_id INT NOT NULL,
    transaction_type ENUM('expense', 'replenishment', 'transfer') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    vendor_name VARCHAR(255),
    receipt_number VARCHAR(100),
    receipt_path VARCHAR(500),
    receipt_original_name VARCHAR(255),
    expense_account_id INT,
    reference_number VARCHAR(100),
    transaction_date DATE NOT NULL,
    notes TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (petty_cash_user_id) REFERENCES petty_cash_users(id),
    FOREIGN KEY (boarding_house_id) REFERENCES boarding_houses(id),
    FOREIGN KEY (expense_account_id) REFERENCES chart_of_accounts_branch(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_petty_cash_user (petty_cash_user_id),
    INDEX idx_boarding_house (boarding_house_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_status (status)
);

-- Petty Cash Balances Table
-- This table tracks the current balance for each petty cash user

CREATE TABLE IF NOT EXISTS petty_cash_balances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    petty_cash_user_id INT NOT NULL,
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    last_replenishment_date DATE,
    last_replenishment_amount DECIMAL(15,2) DEFAULT 0.00,
    total_expenses_month DECIMAL(15,2) DEFAULT 0.00,
    total_expenses_year DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (petty_cash_user_id) REFERENCES petty_cash_users(id),
    UNIQUE KEY unique_user_balance (petty_cash_user_id)
);

-- Insert initial balances for sample users
INSERT IGNORE INTO petty_cash_balances (petty_cash_user_id, current_balance) VALUES
(1, 5000.00),
(2, 2000.00),
(3, 1500.00),
(4, 1000.00);