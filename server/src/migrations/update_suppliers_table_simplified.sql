-- Update suppliers table to simplified structure
-- This migration removes unnecessary columns and keeps only the required fields

-- First, let's backup the existing data in case we need to rollback
-- CREATE TABLE suppliers_backup AS SELECT * FROM suppliers;

-- Remove unnecessary columns from suppliers table
-- Note: Remove IF EXISTS as it's not supported in DROP COLUMN
ALTER TABLE suppliers 
DROP COLUMN name,
DROP COLUMN email,
DROP COLUMN city,
DROP COLUMN state,
DROP COLUMN postal_code,
DROP COLUMN country,
DROP COLUMN tax_id,
DROP COLUMN business_registration,
DROP COLUMN payment_terms,
DROP COLUMN credit_limit,
DROP COLUMN notes;

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