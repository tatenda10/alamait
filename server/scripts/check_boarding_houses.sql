-- Check existing boarding houses
SELECT 
    id,
    name,
    location,
    status,
    created_at
FROM boarding_houses 
WHERE deleted_at IS NULL
ORDER BY id;

-- Check existing petty cash accounts
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
