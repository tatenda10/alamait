-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transaction_id INT NOT NULL,
  expense_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  payment_method ENUM('cash', 'bank_transfer', 'check') NOT NULL,
  reference_number VARCHAR(50),
  expense_account_id INT NOT NULL,
  notes TEXT,
  created_by INT NOT NULL,
  boarding_house_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (expense_account_id) REFERENCES chart_of_accounts_branch(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (boarding_house_id) REFERENCES boarding_houses(id)
); 