const db = require('../src/services/db');

async function check() {
  const conn = await db.getConnection();
  try {
    console.log('Checking student_payments table...\n');
    
    // Check student_payments table structure
    const [structure] = await conn.query(`
      DESCRIBE student_payments
    `);
    
    console.log('student_payments table structure:');
    structure.forEach(column => {
      console.log(`  ${column.Field}: ${column.Type}`);
    });
    
    // Check how many student payments exist
    const [[count]] = await conn.query(`
      SELECT COUNT(*) as count FROM student_payments WHERE deleted_at IS NULL
    `);
    
    console.log(`\nTotal student payments: ${count.count}`);
    
    // Get sample student payments
    const [payments] = await conn.query(`
      SELECT 
        sp.id,
        sp.student_id,
        sp.amount,
        sp.payment_date,
        sp.payment_method,
        sp.payment_type,
        sp.reference_number,
        s.full_name as student_name
      FROM student_payments sp
      JOIN students s ON sp.student_id = s.id
      WHERE sp.deleted_at IS NULL
      ORDER BY sp.payment_date DESC
      LIMIT 10
    `);
    
    console.log('\nSample student payments:');
    payments.forEach(payment => {
      console.log(`  ${payment.student_name}: $${payment.amount} (${payment.payment_date}) - ${payment.payment_method}`);
    });
    
    // Check if there are any student payments linked to the transactions we found earlier
    const [linkedPayments] = await conn.query(`
      SELECT 
        sp.id,
        sp.student_id,
        sp.transaction_id,
        sp.amount,
        sp.payment_date,
        s.full_name as student_name,
        t.reference as transaction_reference
      FROM student_payments sp
      JOIN students s ON sp.student_id = s.id
      JOIN transactions t ON sp.transaction_id = t.id
      WHERE sp.deleted_at IS NULL
        AND t.transaction_type = 'payment'
      ORDER BY sp.payment_date DESC
      LIMIT 10
    `);
    
    console.log('\nStudent payments linked to transactions:');
    linkedPayments.forEach(payment => {
      console.log(`  ${payment.student_name}: $${payment.amount} - Transaction: ${payment.transaction_reference}`);
    });
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

check();


