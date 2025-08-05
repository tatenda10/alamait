-- Student payment schedules table
CREATE TABLE IF NOT EXISTS student_payment_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    enrollment_id INT NOT NULL,
    student_id INT NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    amount_due DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (enrollment_id) REFERENCES student_enrollments(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Student payments table
CREATE TABLE IF NOT EXISTS student_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    enrollment_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'credit_card', 'mobile_money') NOT NULL,
    payment_type ENUM('rent', 'deposit', 'utility', 'penalty', 'other') NOT NULL DEFAULT 'rent',
    reference_number VARCHAR(100),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (enrollment_id) REFERENCES student_enrollments(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Payment receipts table for storing receipt documents
CREATE TABLE IF NOT EXISTS payment_receipts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (payment_id) REFERENCES student_payments(id)
);

-- Payment notifications table for tracking payment reminders and notifications
CREATE TABLE IF NOT EXISTS payment_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    enrollment_id INT NOT NULL,
    type ENUM('reminder', 'overdue', 'confirmation') NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (enrollment_id) REFERENCES student_enrollments(id)
);

-- View to track payment periods and balances
CREATE OR REPLACE VIEW student_payment_periods AS
SELECT 
    se.id AS enrollment_id,
    se.student_id,
    se.agreed_amount,
    se.currency,
    sp.period_start_date,
    sp.period_end_date,
    sp.amount AS paid_amount,
    se.agreed_amount - COALESCE(sp.amount, 0) AS balance,
    CASE 
        WHEN sp.period_end_date < CURRENT_DATE THEN 'overdue'
        WHEN sp.period_end_date = CURRENT_DATE THEN 'due_today'
        ELSE 'upcoming'
    END AS payment_status
FROM student_enrollments se
LEFT JOIN student_payments sp ON se.id = sp.enrollment_id 
    AND sp.deleted_at IS NULL
    AND sp.status = 'completed'
WHERE se.deleted_at IS NULL; 