-- Create rooms table with new fee structure
CREATE TABLE IF NOT EXISTS rooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  capacity INT NOT NULL,
  available_beds INT NOT NULL,
  rent DECIMAL(15,2) NOT NULL,
  admin_fee DECIMAL(15,2) DEFAULT 0.00,
  security_deposit DECIMAL(15,2) DEFAULT 0.00,
  additional_rent DECIMAL(15,2) DEFAULT 0.00,
  description TEXT,
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  boarding_house_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (boarding_house_id) REFERENCES boarding_houses(id)
);

-- Migrate existing data if price_per_bed column exists
-- Note: Run this only if you're upgrading from an older schema
ALTER TABLE rooms 
  ADD COLUMN IF NOT EXISTS rent DECIMAL(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS admin_fee DECIMAL(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS security_deposit DECIMAL(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS additional_rent DECIMAL(15,2) DEFAULT 0.00;

-- Copy existing price_per_bed values to rent if needed
UPDATE rooms 
SET rent = price_per_bed 
WHERE rent = 0 AND price_per_bed IS NOT NULL;

-- Drop old price_per_bed column if it exists
-- Note: Only run this after confirming data migration is successful
-- ALTER TABLE rooms DROP COLUMN IF EXISTS price_per_bed; 