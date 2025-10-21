const db = require('../src/services/db');

async function createTable() {
  const conn = await db.getConnection();
  try {
    console.log('Creating student_transactions table...\n');
    
    // Create the student_transactions table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS student_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        enrollment_id INT NOT NULL,
        transaction_id INT NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        transaction_date DATE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_student_id (student_id),
        INDEX idx_enrollment_id (enrollment_id),
        INDEX idx_transaction_id (transaction_id),
        INDEX idx_transaction_type (transaction_type),
        INDEX idx_transaction_date (transaction_date),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (enrollment_id) REFERENCES student_enrollments(id),
        FOREIGN KEY (transaction_id) REFERENCES transactions(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ student_transactions table created successfully');
    
    // Verify the table exists
    const [tables] = await conn.query(`
      SHOW TABLES LIKE 'student_transactions'
    `);
    
    if (tables.length > 0) {
      console.log('✅ Table verification successful');
    } else {
      console.log('❌ Table creation failed');
    }
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

createTable();
