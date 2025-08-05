-- Create transaction rules table
CREATE TABLE IF NOT EXISTS transaction_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transaction_type VARCHAR(50) NOT NULL,
  debit_account_id INT NOT NULL,
  credit_account_id INT NOT NULL,
  auto_post TINYINT(1) DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (debit_account_id) REFERENCES chart_of_accounts_branch(id),
  FOREIGN KEY (credit_account_id) REFERENCES chart_of_accounts_branch(id)
);

-- Insert default transaction rules for student payments
INSERT INTO transaction_rules (transaction_type, debit_account_id, credit_account_id, auto_post, notes)
SELECT 
  'monthly_rent',
  (SELECT id FROM chart_of_accounts_branch WHERE code = '10002' AND branch_id = 1), -- Cash account
  (SELECT id FROM chart_of_accounts_branch WHERE code = '40001' AND branch_id = 1), -- Rental Income account
  1,
  'Default rule for monthly rent payments - Cash to Rental Income'
WHERE EXISTS (
  SELECT 1 FROM chart_of_accounts_branch WHERE code IN ('10002', '40001') AND branch_id = 1
);

INSERT INTO transaction_rules (transaction_type, debit_account_id, credit_account_id, auto_post, notes)
SELECT 
  'admin_fee',
  (SELECT id FROM chart_of_accounts_branch WHERE code = '10002' AND branch_id = 1), -- Cash account
  (SELECT id FROM chart_of_accounts_branch WHERE code = '40001' AND branch_id = 1), -- Rental Income account
  1,
  'Default rule for admin fee payments - Cash to Rental Income'
WHERE EXISTS (
  SELECT 1 FROM chart_of_accounts_branch WHERE code IN ('10002', '40001') AND branch_id = 1
);

INSERT INTO transaction_rules (transaction_type, debit_account_id, credit_account_id, auto_post, notes)
SELECT 
  'security_deposit',
  (SELECT id FROM chart_of_accounts_branch WHERE code = '10002' AND branch_id = 1), -- Cash account
  (SELECT id FROM chart_of_accounts_branch WHERE code = '20001' AND branch_id = 1), -- Security Deposits Liability account
  1,
  'Default rule for security deposit payments - Cash to Security Deposits'
WHERE EXISTS (
  SELECT 1 FROM chart_of_accounts_branch WHERE code IN ('10002', '20001') AND branch_id = 1
);

-- Create a procedure to update existing payments with transactions
DELIMITER //

CREATE PROCEDURE update_existing_payments_with_transactions()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE payment_id, student_id, boarding_house_id INT;
  DECLARE payment_amount DECIMAL(12,2);
  DECLARE payment_type VARCHAR(50);
  DECLARE payment_date DATE;
  DECLARE payment_ref VARCHAR(100);
  DECLARE cur CURSOR FOR 
    SELECT 
      sp.id,
      sp.student_id,
      sp.amount,
      sp.payment_type,
      sp.payment_date,
      sp.reference_number,
      se.boarding_house_id
    FROM student_payments sp
    JOIN student_enrollments se ON sp.enrollment_id = se.id
    LEFT JOIN transactions t ON t.reference = CONCAT('PMT-', sp.id)
    WHERE t.id IS NULL;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  OPEN cur;

  read_loop: LOOP
    FETCH cur INTO payment_id, student_id, payment_amount, payment_type, payment_date, payment_ref, boarding_house_id;
    
    IF done THEN
      LEAVE read_loop;
    END IF;

    -- Insert transaction
    INSERT INTO transactions (
      transaction_type,
      student_id,
      reference,
      amount,
      description,
      transaction_date,
      boarding_house_id,
      created_at
    ) VALUES (
      'payment',
      student_id,
      CONCAT('PMT-', payment_id),
      payment_amount,
      CONCAT(payment_type, ' payment from student ', student_id),
      payment_date,
      boarding_house_id,
      NOW()
    );

    -- Get transaction rule
    SET @debit_account = (
      SELECT debit_account_id 
      FROM transaction_rules 
      WHERE transaction_type = payment_type 
      AND deleted_at IS NULL 
      LIMIT 1
    );
    
    SET @credit_account = (
      SELECT credit_account_id 
      FROM transaction_rules 
      WHERE transaction_type = payment_type 
      AND deleted_at IS NULL 
      LIMIT 1
    );

    -- Create journal entries if rule exists
    IF @debit_account IS NOT NULL AND @credit_account IS NOT NULL THEN
      -- Debit entry
      INSERT INTO journal_entries (
        transaction_id,
        account_id,
        debit,
        credit,
        description,
        created_at
      ) VALUES (
        LAST_INSERT_ID(),
        @debit_account,
        payment_amount,
        0,
        CONCAT('Payment received - ', payment_type),
        NOW()
      );

      -- Credit entry
      INSERT INTO journal_entries (
        transaction_id,
        account_id,
        debit,
        credit,
        description,
        created_at
      ) VALUES (
        LAST_INSERT_ID(),
        @credit_account,
        0,
        payment_amount,
        CONCAT('Payment recorded - ', payment_type),
        NOW()
      );
    END IF;

  END LOOP;

  CLOSE cur;
END //

DELIMITER ;

-- Execute the procedure to update existing payments
CALL update_existing_payments_with_transactions();

-- Drop the procedure as it's no longer needed
DROP PROCEDURE IF EXISTS update_existing_payments_with_transactions; 