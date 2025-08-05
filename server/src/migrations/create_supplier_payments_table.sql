-- Create supplier_payments table for tracking payments made to suppliers
CREATE TABLE IF NOT EXISTS supplier_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'check', 'mobile_money', 'other') DEFAULT 'cash',
    reference_number VARCHAR(100),
    description TEXT,
    notes TEXT,
    expense_id INT, -- Link to the expense record if applicable
    boarding_house_id INT NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_supplier_payments_supplier (supplier_id),
    INDEX idx_supplier_payments_date (payment_date),
    INDEX idx_supplier_payments_boarding_house (boarding_house_id),
    INDEX idx_supplier_payments_deleted (deleted_at),
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL,
    FOREIGN KEY (boarding_house_id) REFERENCES boarding_houses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);