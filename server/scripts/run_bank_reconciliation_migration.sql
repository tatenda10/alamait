-- Run Bank Reconciliation Tables Migration
-- This script creates the necessary tables for bank reconciliation functionality

-- Create uploads directory for bank statements (if it doesn't exist)
-- Note: This should be done manually or by the application

-- Run the bank reconciliation tables migration
SOURCE src/migrations/bank_reconciliation_tables.sql;

-- Verify tables were created
SHOW TABLES LIKE 'bank_%';

-- Show table structures
DESCRIBE bank_statements;
DESCRIBE bank_statement_items;
DESCRIBE bank_reconciliations;
DESCRIBE bank_reconciliation_items;
