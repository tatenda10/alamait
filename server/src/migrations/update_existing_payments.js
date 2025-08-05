const db = require('../services/db');

async function updateExistingPayments() {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get all payments that don't have corresponding transactions
    const [payments] = await connection.query(
      `SELECT 
        sp.*,
        se.currency,
        se.boarding_house_id
       FROM student_payments sp
       JOIN student_enrollments se ON sp.enrollment_id = se.id
       LEFT JOIN transactions t ON t.reference = CONCAT('PMT-', sp.id)
       WHERE sp.deleted_at IS NULL
         AND t.id IS NULL`
    );

    console.log(`Found ${payments.length} payments without transactions`);

    for (const payment of payments) {
      // Get transaction rules for the payment type
      const [rules] = await connection.query(
        `SELECT * FROM transaction_rules 
         WHERE transaction_type = ? 
         AND deleted_at IS NULL`,
        [payment.payment_type]
      );

      if (rules.length === 0) {
        console.log(`No transaction rules found for payment type: ${payment.payment_type}`);
        continue;
      }

      const rule = rules[0];

      // Create transaction record
      const [transactionResult] = await connection.query(
        `INSERT INTO transactions (
          transaction_type,
          student_id,
          reference,
          amount,
          currency,
          description,
          transaction_date,
          boarding_house_id,
          created_by,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          payment.payment_type,
          payment.student_id,
          `PMT-${payment.id}`,
          payment.amount,
          payment.currency,
          `${payment.payment_type.replace('_', ' ')} payment from student ${payment.student_id}`,
          payment.payment_date,
          payment.boarding_house_id,
          payment.created_by
        ]
      );

      // Create debit entry
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id,
          account_id,
          debit,
          credit,
          description,
          created_at
        ) VALUES (?, ?, ?, 0, ?, NOW())`,
        [
          transactionResult.insertId,
          rule.debit_account_id,
          payment.amount,
          `Debit entry for ${payment.payment_type.replace('_', ' ')} payment`
        ]
      );

      // Create credit entry
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id,
          account_id,
          debit,
          credit,
          description,
          created_at
        ) VALUES (?, ?, 0, ?, ?, NOW())`,
        [
          transactionResult.insertId,
          rule.credit_account_id,
          payment.amount,
          `Credit entry for ${payment.payment_type.replace('_', ' ')} payment`
        ]
      );

      console.log(`Created transaction and journal entries for payment ID: ${payment.id}`);
    }

    await connection.commit();
    console.log('Successfully updated all existing payments');
  } catch (error) {
    await connection.rollback();
    console.error('Error updating existing payments:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run the update
updateExistingPayments()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 