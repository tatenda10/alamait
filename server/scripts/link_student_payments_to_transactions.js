const db = require('../src/services/db');

async function linkPayments() {
  const conn = await db.getConnection();
  try {
    console.log('Linking student payments to transactions...\n');
    
    // Get all student payments that don't have transaction_id
    const [unlinkedPayments] = await conn.query(`
      SELECT 
        sp.id as payment_id,
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
        AND (sp.transaction_id IS NULL OR sp.transaction_id = 0)
      ORDER BY sp.payment_date DESC
      LIMIT 20
    `);
    
    console.log(`Found ${unlinkedPayments.length} unlinked student payments:\n`);
    
    let linkedCount = 0;
    let notFoundCount = 0;
    
    for (const payment of unlinkedPayments) {
      console.log(`Processing: ${payment.student_name} - $${payment.amount} (${payment.payment_date})`);
      
      // Find matching transaction by student name and amount
      const [transactions] = await conn.query(`
        SELECT 
          t.id,
          t.reference,
          t.amount,
          t.transaction_date,
          t.description
        FROM transactions t
        WHERE t.transaction_type = 'payment'
          AND t.deleted_at IS NULL
          AND t.amount = ?
          AND DATE(t.transaction_date) = ?
          AND t.description LIKE ?
        ORDER BY t.created_at DESC
        LIMIT 1
      `, [
        payment.amount,
        payment.payment_date,
        `%${payment.student_name}%`
      ]);
      
      if (transactions.length > 0) {
        const transaction = transactions[0];
        console.log(`  ✅ Found matching transaction: ${transaction.reference}`);
        
        // Update the student payment with transaction_id
        await conn.query(
          'UPDATE student_payments SET transaction_id = ? WHERE id = ?',
          [transaction.id, payment.payment_id]
        );
        
        console.log(`  ✅ Linked payment to transaction ${transaction.id}`);
        linkedCount++;
      } else {
        console.log(`  ❌ No matching transaction found`);
        notFoundCount++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`SUMMARY:`);
    console.log(`✅ Linked: ${linkedCount} payments`);
    console.log(`❌ Not found: ${notFoundCount} payments`);
    
    // Verify the linking
    console.log('\nVerifying linked payments...');
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
        AND sp.transaction_id IS NOT NULL
      ORDER BY sp.payment_date DESC
      LIMIT 10
    `);
    
    console.log(`Found ${linkedPayments.length} linked payments:`);
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

linkPayments();


