CREATE TABLE journal_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT NOT NULL,
    account_id INT NOT NULL,
    entry_type ENUM('debit', 'credit') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    boarding_house_id INT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts_branch(id),
    FOREIGN KEY (boarding_house_id) REFERENCES boarding_houses(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
); 