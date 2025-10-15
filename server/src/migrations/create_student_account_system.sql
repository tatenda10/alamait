-- Create student_account_balances table
CREATE TABLE IF NOT EXISTS student_account_balances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  enrollment_id INT NOT NULL,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (enrollment_id) REFERENCES student_enrollments(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_enrollment (student_id, enrollment_id),
  INDEX idx_balance_student (student_id),
  INDEX idx_balance_enrollment (enrollment_id)
);

-- Create student_invoices table for charges/debits
CREATE TABLE IF NOT EXISTS student_invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  enrollment_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  invoice_date DATE NOT NULL,
  reference_number VARCHAR(100),
  notes TEXT,
  status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (enrollment_id) REFERENCES student_enrollments(id) ON DELETE CASCADE,
  INDEX idx_invoice_student (student_id),
  INDEX idx_invoice_enrollment (enrollment_id),
  INDEX idx_invoice_status (status),
  INDEX idx_invoice_date (invoice_date)
);

-- Add reference_number column to student_payments if it doesn't exist
ALTER TABLE student_payments 
ADD COLUMN reference_number VARCHAR(100) AFTER payment_type;
