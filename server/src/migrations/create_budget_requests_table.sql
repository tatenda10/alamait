-- Create budget_requests table
CREATE TABLE budget_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    boarding_house_id INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    submitted_by INT NOT NULL,
    submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INT NULL,
    approved_date TIMESTAMP NULL,
    rejected_by INT NULL,
    rejected_date TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (boarding_house_id) REFERENCES boarding_houses(id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_month_year (month, year),
    INDEX idx_status (status),
    INDEX idx_submitted_by (submitted_by),
    INDEX idx_boarding_house_id (boarding_house_id)
);

-- Create budget_categories table
CREATE TABLE budget_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    budget_request_id INT NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_request_id) REFERENCES budget_requests(id) ON DELETE CASCADE,
    INDEX idx_budget_request_id (budget_request_id)
);
