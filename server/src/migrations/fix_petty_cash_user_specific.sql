-- Fix petty cash system to be user-specific
-- This migration properly converts the system to user-specific

-- Step 1: Drop the existing petty_cash_accounts table completely
DROP TABLE IF EXISTS petty_cash_accounts;

-- Step 2: Drop user-specific tables that shouldn't exist
DROP TABLE IF EXISTS petty_cash_users;
DROP TABLE IF EXISTS petty_cash_balances;

-- Step 3: Create new user-specific petty_cash_accounts table
CREATE TABLE petty_cash_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    boarding_house_id INT NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_code VARCHAR(20) NOT NULL,
    initial_balance DECIMAL(15,2) DEFAULT 0.00,
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    beginning_balance DECIMAL(15,2) DEFAULT 0.00,
    total_inflows DECIMAL(15,2) DEFAULT 0.00,
    total_outflows DECIMAL(15,2) DEFAULT 0.00,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (boarding_house_id) REFERENCES boarding_houses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_boarding_house (user_id, boarding_house_id, deleted_at),
    INDEX idx_user_id (user_id),
    INDEX idx_boarding_house_id (boarding_house_id),
    INDEX idx_status (status)
);

-- Step 4: Add user_id column to petty_cash_transactions
ALTER TABLE petty_cash_transactions 
ADD COLUMN user_id INT AFTER id;

-- Step 5: Add foreign key constraint for user_id
ALTER TABLE petty_cash_transactions 
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 6: Add index for user_id
ALTER TABLE petty_cash_transactions 
ADD INDEX idx_user_id (user_id);

-- Step 7: Create initial petty cash accounts for existing users
INSERT INTO petty_cash_accounts (user_id, boarding_house_id, account_name, account_code, initial_balance, current_balance, beginning_balance, total_inflows, total_outflows, status, created_by)
SELECT 
    u.id as user_id,
    u.boarding_house_id,
    CONCAT('Petty Cash - ', u.full_name) as account_name,
    CONCAT('PC-', LPAD(u.id, 3, '0')) as account_code,
    0.00 as initial_balance,
    0.00 as current_balance,
    0.00 as beginning_balance,
    0.00 as total_inflows,
    0.00 as total_outflows,
    'active' as status,
    1 as created_by
FROM users u
WHERE u.deleted_at IS NULL 
  AND u.boarding_house_id IS NOT NULL;

-- Step 8: Update existing transactions to include user_id
UPDATE petty_cash_transactions 
SET user_id = created_by 
WHERE user_id IS NULL;
