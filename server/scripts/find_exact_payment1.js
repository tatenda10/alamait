const db = require('../src/services/db');

async function findExactPayment1() {
  const conn = await db.getConnection();
  try {
    console.log('🔍 Finding exact PAYMENT 1 transactions...\n');

    // Payment amounts from the PAYMENT 1 column in your ledger (exact amounts)
    const payment1Amounts = [
      180.00, 130.00, 150.00, 170.00, 120.00, 100.00, 70.00, 190.00, 20.00, 240.00,
      95.00, 100.00, 60.00, 65.00, 540.00, 210.00, 220.00, 200.00, 160.00, 150.00
    ];

    console.log(`📊 Looking for exact ${payment1Amounts.length} payment amounts from PAYMENT 1 column\n`);

    // Find transactions that match these amounts exactly
    const placeholders = payment1Amounts.map(() => '?').join(',');
    const [transactions] = await conn.query(
      `SELECT 
        t.id,
        t.transaction_date,
        t.amount,
        t.transaction_type,
        t.description,
        t.created_at
      FROM transactions t
      WHERE t.amount IN (${placeholders})
        AND t.transaction_type = 'payment'
        AND t.deleted_at IS NULL
      ORDER BY t.amount, t.transaction_date`,
      payment1Amounts
    );

    console.log(`✅ Found ${transactions.length} matching transactions:\n`);

    // Group by amount to see duplicates
    const amountGroups = {};
    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      if (!amountGroups[amount]) {
        amountGroups[amount] = [];
      }
      amountGroups[amount].push(transaction);
    });

    console.log('📊 Transactions grouped by amount:');
    Object.keys(amountGroups).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach(amount => {
      const transactions = amountGroups[amount];
      console.log(`   $${amount}: ${transactions.length} transaction(s)`);
      transactions.forEach(t => {
        console.log(`      - ID: ${t.id} | ${t.description}`);
      });
    });

    let totalAmount = 0;
    transactions.forEach((transaction, index) => {
      console.log(`${index + 1}. ID: ${transaction.id} | Amount: $${transaction.amount} | Date: ${transaction.transaction_date} | Description: ${transaction.description || 'N/A'}`);
      totalAmount += parseFloat(transaction.amount);
    });

    console.log(`\n📊 PAYMENT 1 Summary:`);
    console.log(`   Total transactions found: ${transactions.length}`);
    console.log(`   Total amount: $${totalAmount.toFixed(2)}`);
    console.log(`   Expected: 51 transactions, $8,641.00`);

    // Check if we found all expected amounts
    const foundAmounts = transactions.map(t => parseFloat(t.amount));
    const missingAmounts = payment1Amounts.filter(amount => !foundAmounts.includes(amount));
    
    if (missingAmounts.length > 0) {
      console.log(`\n⚠️  Missing amounts (not found in database):`);
      missingAmounts.forEach(amount => {
        console.log(`   - $${amount}`);
      });
    } else {
      console.log(`\n✅ All PAYMENT 1 amounts found in database!`);
    }

    // Show transaction IDs for deletion
    const transactionIds = transactions.map(t => t.id);
    console.log(`\n🗑️  Transaction IDs to delete: [${transactionIds.join(', ')}]`);

    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    conn.release();
    process.exit(1);
  }
}

findExactPayment1();
