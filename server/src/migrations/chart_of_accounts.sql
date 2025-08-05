-- Branch-specific Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts_branch (
    id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense') NOT NULL,
    is_category BOOLEAN DEFAULT false,
    parent_id INT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (parent_id) REFERENCES chart_of_accounts_branch(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (branch_id) REFERENCES boarding_houses(id),
    UNIQUE KEY unique_code_branch (code, branch_id, deleted_at),
    UNIQUE KEY unique_name_under_parent_branch (name, parent_id, branch_id, deleted_at)
); 