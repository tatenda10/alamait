-- Pending Petty Cash Expenses Table
-- This table temporarily holds petty cash expenses until they are approved

CREATE TABLE IF NOT EXISTS pending_petty_cash_expenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    petty_cash_user_id INT NOT NULL,
    boarding_house_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    vendor_name VARCHAR(255),
    receipt_number VARCHAR(100),
    receipt_path VARCHAR(500),
    receipt_original_name VARCHAR(255),
    expense_account_id INT,
    reference_number VARCHAR(100),
    expense_date DATE NOT NULL,
    notes TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    submitted_by INT NOT NULL, -- User who submitted the expense
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INT NULL, -- Admin who reviewed the expense
    reviewed_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (petty_cash_user_id) REFERENCES petty_cash_users(id),
    FOREIGN KEY (boarding_house_id) REFERENCES boarding_houses(id),
    FOREIGN KEY (expense_account_id) REFERENCES chart_of_accounts_branch(id),
    FOREIGN KEY (submitted_by) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    INDEX idx_petty_cash_user (petty_cash_user_id),
    INDEX idx_boarding_house (boarding_house_id),
    INDEX idx_expense_date (expense_date),
    INDEX idx_status (status),
    INDEX idx_submitted_by (submitted_by),
    INDEX idx_reviewed_by (reviewed_by)
);