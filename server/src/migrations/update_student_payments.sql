-- Drop foreign keys first to avoid conflicts
ALTER TABLE student_payments
DROP FOREIGN KEY IF EXISTS student_payments_ibfk_1,
DROP FOREIGN KEY IF EXISTS student_payments_ibfk_2,
DROP FOREIGN KEY IF EXISTS student_payments_ibfk_3;

-- Drop and recreate the student_payments table with updated structure
DROP TABLE IF EXISTS student_payments;

CREATE TABLE student_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    enrollment_id INT NOT NULL,
    schedule_id INT,
    transaction_id INT,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'petty_cash', 'credit_card') NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (enrollment_id) REFERENCES student_enrollments(id),
    FOREIGN KEY (schedule_id) REFERENCES student_payment_schedules(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
); 