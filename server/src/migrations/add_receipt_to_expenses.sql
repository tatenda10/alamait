-- Add receipt field to expenses table
ALTER TABLE expenses
  ADD COLUMN receipt_path VARCHAR(255) NULL,
  ADD COLUMN receipt_original_name VARCHAR(255) NULL; 