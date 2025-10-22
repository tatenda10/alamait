const db = require('../src/services/db');

async function checkPaymentCount() {
  const conn = await db.getConnection();
  try {
    console.log('🔍 Checking payment transaction counts...\n');

    // PAYMENT 1 column amounts to exclude
    const payment1Amounts = [
      180.00, 130.00, 150.00, 170.00, 120.00, 100.00, 70.00, 190.00, 20.00, 240.00,
      95.00, 100.00, 60.00, 65.00, 540.00, 210.00, 220.00, 200.00, 160.00, 150.00
    ];

    // Get all payment transactions
    const [allPayments] = await conn.query(
      `SELECT id, amount, description, transaction_date
       FROM transactions 
       WHERE transaction_type = 'payment' 
         AND deleted_at IS NULL
       ORDER BY amount DESC`
    );

    console.log(`📊 Total payment transactions: ${allPayments.length}`);

    // Get payment transactions excluding PAYMENT 1 amounts
    const placeholders = payment1Amounts.map(() => '?').join(',');
    const [excludedPayments] = await conn.query(
      `SELECT id, amount, description, transaction_date
       FROM transactions 
       WHERE transaction_type = 'payment' 
         AND amount NOT IN (${placeholders})
         AND deleted_at IS NULL
       ORDER BY amount DESC`,
      payment1Amounts
    );

    console.log(`🚫 After excluding PAYMENT 1 amounts: ${excludedPayments.length}`);
    console.log(`📋 PAYMENT 1 amounts to exclude: [${payment1Amounts.join(', ')}]`);

    // Show some examples of what we're excluding
    const [excludedExamples] = await conn.query(
      `SELECT id, amount, description
       FROM transactions 
       WHERE transaction_type = 'payment' 
         AND amount IN (${placeholders})
         AND deleted_at IS NULL
       ORDER BY amount DESC`,
      payment1Amounts
    );

    console.log(`\n🔍 Examples of excluded transactions:`);
    excludedExamples.slice(0, 10).forEach(t => {
      console.log(`  ID: ${t.id}, Amount: $${t.amount}, Description: ${t.description}`);
    });

    // Check if we have the right total
    const totalExcluded = excludedExamples.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalRemaining = excludedPayments.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    console.log(`\n💰 Total excluded amount: $${totalExcluded.toFixed(2)}`);
    console.log(`💰 Total remaining amount: $${totalRemaining.toFixed(2)}`);

    // Show amount distribution
    console.log(`\n📊 Amount distribution in remaining payments:`);
    const amountCounts = {};
    excludedPayments.forEach(t => {
      const amount = parseFloat(t.amount);
      amountCounts[amount] = (amountCounts[amount] || 0) + 1;
    });
    
    Object.entries(amountCounts)
      .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
      .slice(0, 20)
      .forEach(([amount, count]) => {
        console.log(`  $${amount}: ${count} transactions`);
      });

    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    conn.release();
    process.exit(1);
  }
}

checkPaymentCount();
