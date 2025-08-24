-- Create current_account_balances as a table instead of a view
-- This will be more efficient and easier to maintain

-- Drop the view if it exists
DROP VIEW IF EXISTS current_account_balances;

-- Create the current_account_balances table
CREATE TABLE current_account_balances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense') NOT NULL,
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_debits DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_credits DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    transaction_count INT NOT NULL DEFAULT 0,
    last_transaction_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    UNIQUE KEY unique_account (account_id),
    INDEX idx_account_code (account_code),
    INDEX idx_account_type (account_type)
);

-- Insert initial data for all accounts
INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
SELECT 
    coa.id AS account_id,
    coa.code AS account_code,
    coa.name AS account_name,
    coa.type AS account_type,
    COALESCE(
        SUM(
            CASE 
                WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'debit' THEN je.amount
                WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'credit' THEN -je.amount
                WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'credit' THEN je.amount
                WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'debit' THEN -je.amount
                ELSE 0
            END
        ), 0
    ) AS current_balance,
    COALESCE(
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0
    ) AS total_debits,
    COALESCE(
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0
    ) AS total_credits,
    COUNT(DISTINCT je.transaction_id) AS transaction_count,
    MAX(t.transaction_date) AS last_transaction_date
FROM chart_of_accounts coa
LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
LEFT JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL AND t.status = 'posted'
WHERE coa.deleted_at IS NULL
GROUP BY coa.id, coa.code, coa.name, coa.type;

-- Create a stored procedure to update account balances
DELIMITER //
CREATE PROCEDURE UpdateAccountBalance(IN accountId INT)
BEGIN
    DECLARE currentBalance DECIMAL(15,2) DEFAULT 0;
    DECLARE totalDebits DECIMAL(15,2) DEFAULT 0;
    DECLARE totalCredits DECIMAL(15,2) DEFAULT 0;
    DECLARE transactionCount INT DEFAULT 0;
    DECLARE lastTransactionDate DATE DEFAULT NULL;
    DECLARE accountType VARCHAR(20);
    
    -- Get account type
    SELECT type INTO accountType FROM chart_of_accounts WHERE id = accountId;
    
    -- Calculate current balance based on account type
    SELECT 
        COALESCE(
            SUM(
                CASE 
                    WHEN accountType IN ('Asset', 'Expense') AND je.entry_type = 'debit' THEN je.amount
                    WHEN accountType IN ('Asset', 'Expense') AND je.entry_type = 'credit' THEN -je.amount
                    WHEN accountType IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'credit' THEN je.amount
                    WHEN accountType IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'debit' THEN -je.amount
                    ELSE 0
                END
            ), 0
        ),
        COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0),
        COUNT(DISTINCT je.transaction_id),
        MAX(t.transaction_date)
    INTO currentBalance, totalDebits, totalCredits, transactionCount, lastTransactionDate
    FROM journal_entries je
    JOIN transactions t ON je.transaction_id = t.id
    WHERE je.account_id = accountId 
      AND je.deleted_at IS NULL 
      AND t.deleted_at IS NULL 
      AND t.status = 'posted';
    
    -- Insert or update the balance record
    INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
    SELECT 
        coa.id,
        coa.code,
        coa.name,
        coa.type,
        currentBalance,
        totalDebits,
        totalCredits,
        transactionCount,
        lastTransactionDate
    FROM chart_of_accounts coa
    WHERE coa.id = accountId
    ON DUPLICATE KEY UPDATE
        current_balance = VALUES(current_balance),
        total_debits = VALUES(total_debits),
        total_credits = VALUES(total_credits),
        transaction_count = VALUES(transaction_count),
        last_transaction_date = VALUES(last_transaction_date),
        updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- Create a trigger to update account balance when journal entries are inserted
DELIMITER //
CREATE TRIGGER after_journal_entry_insert
AFTER INSERT ON journal_entries
FOR EACH ROW
BEGIN
    CALL UpdateAccountBalance(NEW.account_id);
END //
DELIMITER ;

-- Create a trigger to update account balance when journal entries are updated
DELIMITER //
CREATE TRIGGER after_journal_entry_update
AFTER UPDATE ON journal_entries
FOR EACH ROW
BEGIN
    IF OLD.account_id != NEW.account_id THEN
        CALL UpdateAccountBalance(OLD.account_id);
    END IF;
    CALL UpdateAccountBalance(NEW.account_id);
END //
DELIMITER ;

-- Create a trigger to update account balance when journal entries are deleted
DELIMITER //
CREATE TRIGGER after_journal_entry_delete
AFTER DELETE ON journal_entries
FOR EACH ROW
BEGIN
    CALL UpdateAccountBalance(OLD.account_id);
END //
DELIMITER ;

-- Create a trigger to update account balance when transactions status changes
DELIMITER //
CREATE TRIGGER after_transaction_status_update
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        -- Update balances for all accounts in this transaction
        UPDATE current_account_balances cab
        JOIN journal_entries je ON cab.account_id = je.account_id
        WHERE je.transaction_id = NEW.id
        SET cab.updated_at = CURRENT_TIMESTAMP;
        
        -- Recalculate balances for affected accounts
        CALL UpdateAccountBalance(
            (SELECT DISTINCT je.account_id FROM journal_entries je WHERE je.transaction_id = NEW.id LIMIT 1)
        );
    END IF;
END //
DELIMITER ;
