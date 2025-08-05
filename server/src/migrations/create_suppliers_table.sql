-- Create suppliers table for managing supplier information
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    tax_id VARCHAR(50),
    business_registration VARCHAR(100),
    category VARCHAR(100) DEFAULT 'General',
    status ENUM('active', 'inactive') DEFAULT 'active',
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT,
    boarding_house_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (boarding_house_id) REFERENCES boarding_houses(id) ON DELETE CASCADE,
    INDEX idx_suppliers_boarding_house (boarding_house_id),
    INDEX idx_suppliers_status (status),
    INDEX idx_suppliers_category (category)
);

-- Insert some default categories for suppliers
INSERT IGNORE INTO suppliers (name, company, contact_person, phone, email, category, boarding_house_id) VALUES
('Sample Food Supplier', 'Fresh Foods Ltd', 'John Doe', '+1234567890', 'john@freshfoods.com', 'Food & Beverages', 1),
('Cleaning Supplies Co', 'CleanCorp', 'Jane Smith', '+1234567891', 'jane@cleancorp.com', 'Cleaning Supplies', 1),
('Maintenance Services', 'FixIt Pro', 'Bob Wilson', '+1234567892', 'bob@fixitpro.com', 'Maintenance', 1);