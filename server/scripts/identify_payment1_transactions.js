const db = require('../src/services/db');

async function identifyPayment1Transactions() {
  const conn = await db.getConnection();
  try {
    console.log('🔍 Identifying PAYMENT 1 column transactions...\n');

    // Get all payment transactions
    const [allPayments] = await conn.query(
      `SELECT id, amount, description, transaction_date
       FROM transactions 
       WHERE transaction_type = 'payment' 
         AND deleted_at IS NULL
       ORDER BY amount DESC`
    );

    console.log(`📊 Total payment transactions: ${allPayments.length}`);

    // PAYMENT 1 column amounts from the image (exact amounts)
    const payment1Amounts = [
      180.00, 130.00, 150.00, 170.00, 120.00, 100.00, 70.00, 190.00, 20.00, 240.00,
      95.00, 100.00, 60.00, 65.00, 540.00, 210.00, 220.00, 200.00, 160.00, 150.00
    ];

    // Find transactions that match PAYMENT 1 amounts
    const payment1Transactions = [];
    const remainingTransactions = [];

    for (const payment of allPayments) {
      const amount = parseFloat(payment.amount);
      if (payment1Amounts.includes(amount)) {
        payment1Transactions.push(payment);
      } else {
        remainingTransactions.push(payment);
      }
    }

    console.log(`🎯 PAYMENT 1 transactions found: ${payment1Transactions.length}`);
    console.log(`📝 Remaining transactions: ${remainingTransactions.length}`);

    // Show PAYMENT 1 transactions
    console.log(`\n🔍 PAYMENT 1 transactions to exclude:`);
    payment1Transactions.forEach(t => {
      console.log(`  ID: ${t.id}, Amount: $${t.amount}, Description: ${t.description}`);
    });

    // Show remaining transactions
    console.log(`\n📝 Remaining transactions to include:`);
    remainingTransactions.slice(0, 10).forEach(t => {
      console.log(`  ID: ${t.id}, Amount: $${t.amount}, Description: ${t.description}`);
    });

    // Calculate totals
    const payment1Total = payment1Transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const remainingTotal = remainingTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    console.log(`\n💰 PAYMENT 1 total: $${payment1Total.toFixed(2)}`);
    console.log(`💰 Remaining total: $${remainingTotal.toFixed(2)}`);

    // Check if we have the right count
    if (remainingTransactions.length === 51) {
      console.log(`✅ Perfect! We have exactly 51 remaining transactions as expected.`);
    } else {
      console.log(`❌ Expected 51 transactions, but found ${remainingTransactions.length}`);
    }

    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    conn.release();
    process.exit(1);
  }
}

identifyPayment1Transactions();
