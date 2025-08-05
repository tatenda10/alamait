-- Update suppliers table to simplified structure
-- Based on current table structure: id, name, contact_person, phone, email, address, boarding_house_id, created_at, updated_at

-- First, let's backup the existing data in case we need to rollback
-- CREATE TABLE suppliers_backup AS SELECT * FROM suppliers;

-- Add missing columns that our application needs
ALTER TABLE suppliers 
ADD COLUMN company VARCHAR(255) AFTER id,
ADD COLUMN category VARCHAR(100) DEFAULT 'General' AFTER address,
ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active' AFTER category;

-- Update existing data: copy name to company if company is empty
UPDATE suppliers 
SET company = COALESCE(NULLIF(company, ''), name, 'Unknown Company')
WHERE company IS NULL OR company = '';

-- Remove unnecessary columns from suppliers table
ALTER TABLE suppliers 
DROP COLUMN name,
DROP COLUMN email;

-- Ensure required columns exist and have proper constraints
ALTER TABLE suppliers 
MODIFY COLUMN company VARCHAR(255) NOT NULL,
MODIFY COLUMN contact_person VARCHAR(255) NOT NULL,
MODIFY COLUMN phone VARCHAR(20) NOT NULL,
MODIFY COLUMN address TEXT NOT NULL,
MODIFY COLUMN category VARCHAR(100) NOT NULL DEFAULT 'General',
MODIFY COLUMN status ENUM('active', 'inactive') DEFAULT 'active',
MODIFY COLUMN boarding_house_id INT NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_boarding_house ON suppliers(boarding_house_id);

-- Update any existing data to ensure consistency
UPDATE suppliers 
SET 
    company = COALESCE(NULLIF(company, ''), 'Unknown Company'),
    contact_person = COALESCE(NULLIF(contact_person, ''), 'Unknown Contact'),
    phone = COALESCE(NULLIF(phone, ''), 'N/A'),
    address = COALESCE(NULLIF(address, ''), 'Address not provided'),
    category = COALESCE(NULLIF(category, ''), 'General'),
    status = COALESCE(status, 'active'),
    boarding_house_id = COALESCE(boarding_house_id, 1)
WHERE 
    company IS NULL OR company = '' OR
    contact_person IS NULL OR contact_person = '' OR
    phone IS NULL OR phone = '' OR
    address IS NULL OR address = '' OR
    category IS NULL OR category = '' OR
    boarding_house_id IS NULL;

-- Insert some sample data if table is empty
INSERT IGNORE INTO suppliers (company, contact_person, phone, address, category, status, boarding_house_id) VALUES
('ABC Food Supplies', 'John Smith', '+1234567890', '123 Main St, City, State', 'Food & Beverages', 'active', 1),
('XYZ Cleaning Services', 'Jane Doe', '+1234567891', '456 Oak Ave, City, State', 'Cleaning Supplies', 'active', 1),
('FixIt Pro Maintenance', 'Bob Wilson', '+1234567892', '789 Pine Rd, City, State', 'Maintenance Services', 'active', 1),
('Office Depot Supplies', 'Sarah Johnson', '+1234567893', '321 Elm St, City, State', 'Office Supplies', 'active', 1),
('Green Garden Supplies', 'Mike Brown', '+1234567894', '654 Maple Dr, City, State', 'Garden & Landscaping', 'active', 1);

-- Verify the table structure
-- DESCRIBE suppliers;