-- Add supplier_id column to expenses table
-- This will allow linking expenses to suppliers for better tracking

ALTER TABLE expenses 
ADD COLUMN supplier_id INT NULL AFTER expense_account_id,
ADD INDEX idx_expenses_supplier_id (supplier_id),
ADD FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- Update existing expenses to have NULL supplier_id (they will remain as internal expenses)
-- No data update needed as the column is added as NULL by default