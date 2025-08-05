-- Create saved_income_statements table for storing saved income statement reports
CREATE TABLE IF NOT EXISTS saved_income_statements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    boarding_house_ids JSON,
    is_consolidated BOOLEAN DEFAULT FALSE,
    income_data JSON,
    adjustments JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_saved_income_statements_dates (start_date, end_date),
    INDEX idx_saved_income_statements_created_by (created_by),
    INDEX idx_saved_income_statements_deleted (deleted_at),
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Add some sample data if needed (optional)
-- INSERT INTO saved_income_statements (name, start_date, end_date, boarding_house_ids, is_consolidated, income_data, adjustments, created_by)
-- VALUES ('Monthly Report - January 2024', '2024-01-01', '2024-01-31', '[]', true, '{}', '{}', 1);