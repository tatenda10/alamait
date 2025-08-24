-- Create ST KILDA PETTYCASH Account
-- This script creates a petty cash account for ST KILDA boarding house

-- First, let's check if the petty cash accounts table exists
SHOW TABLES LIKE 'petty_cash_accounts';

-- Check if there's already a petty cash account for boarding house ID 1
SELECT 
    pca.id,
    pca.boarding_house_id,
    bh.name as boarding_house_name,
    pca.current_balance,
    pca.total_inflows,
    pca.total_outflows,
    pca.created_at,
    pca.updated_at
FROM petty_cash_accounts pca
LEFT JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
WHERE pca.boarding_house_id = 1;

-- Create the ST KILDA PETTYCASH account
-- Note: The petty_cash_accounts table doesn't have a name field, 
-- so we'll create it for boarding house ID 1 (assuming that's ST KILDA)
INSERT INTO petty_cash_accounts (
    boarding_house_id,
    current_balance,
    total_inflows,
    total_outflows,
    created_at
)
VALUES (
    1, -- boarding_house_id (assuming ST KILDA is ID 1)
    0.00, -- current_balance (start with 0)
    0.00, -- total_inflows
    0.00, -- total_outflows
    NOW() -- created_at
)
ON DUPLICATE KEY UPDATE 
    updated_at = NOW();

-- Verify the account was created
SELECT 
    pca.id,
    pca.boarding_house_id,
    bh.name as boarding_house_name,
    pca.current_balance,
    pca.total_inflows,
    pca.total_outflows,
    pca.created_at,
    pca.updated_at
FROM petty_cash_accounts pca
LEFT JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
WHERE pca.boarding_house_id = 1;

-- Show all petty cash accounts for reference
SELECT 
    pca.id,
    pca.boarding_house_id,
    bh.name as boarding_house_name,
    pca.current_balance,
    pca.total_inflows,
    pca.total_outflows,
    pca.created_at,
    pca.updated_at
FROM petty_cash_accounts pca
LEFT JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
ORDER BY pca.boarding_house_id;
