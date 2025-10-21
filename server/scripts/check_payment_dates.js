const db = require('../src/services/db');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Checking student payment transaction dates...');
    
    // Check all payment transactions and their dates
    const [paymentTransactions] = await conn.query(
      `SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        t.status,
        t.deleted_at
      FROM transactions t
      WHERE t.transaction_type = 'payment'
      ORDER BY t.transaction_date
      LIMIT 10`
    );
    
    console.log(`Payment transactions found: ${paymentTransactions.length}`);
    
    if (paymentTransactions.length > 0) {
      console.log('Sample payment transactions:');
      paymentTransactions.forEach(tx => {
        console.log(`  ${tx.id}: ${tx.description} - $${tx.amount}`);
        console.log(`    Date: ${tx.transaction_date}`);
        console.log(`    Status: ${tx.status}`);
        console.log(`    Deleted: ${tx.deleted_at ? 'YES' : 'NO'}`);
        console.log('');
      });
    }
    
    // Check date range of payment transactions
    const [dateRange] = await conn.query(
      `SELECT 
        MIN(transaction_date) as earliest_date,
        MAX(transaction_date) as latest_date,
        COUNT(*) as total_count
      FROM transactions 
      WHERE transaction_type = 'payment' AND deleted_at IS NULL`
    );
    
    console.log(`Payment transaction date range:`);
    console.log(`  Earliest: ${dateRange[0]?.earliest_date}`);
    console.log(`  Latest: ${dateRange[0]?.latest_date}`);
    console.log(`  Total count: ${dateRange[0]?.total_count}`);
    
    // Check if any payment transactions are in September 2025
    const [septPayments] = await conn.query(
      `SELECT COUNT(*) as count
       FROM transactions 
       WHERE transaction_type = 'payment'
         AND DATE(transaction_date) BETWEEN '2025-09-01' AND '2025-09-30'
         AND deleted_at IS NULL`
    );
    
    console.log(`\nPayment transactions in September 2025: ${septPayments[0]?.count || 0}`);
    
    // Check what transaction types exist
    const [transactionTypes] = await conn.query(
      `SELECT 
        transaction_type,
        COUNT(*) as count,
        MIN(transaction_date) as earliest_date,
        MAX(transaction_date) as latest_date
      FROM transactions 
      WHERE deleted_at IS NULL
      GROUP BY transaction_type
      ORDER BY count DESC`
    );
    
    console.log(`\nAll transaction types:`);
    transactionTypes.forEach(type => {
      console.log(`  ${type.transaction_type}: ${type.count} transactions (${type.earliest_date} to ${type.latest_date})`);
    });
    
    // Check if there are any transactions with 'payment' in the description
    const [paymentLikeTransactions] = await conn.query(
      `SELECT 
        t.id,
        t.transaction_type,
        t.description,
        t.transaction_date,
        t.amount
      FROM transactions t
      WHERE t.description LIKE '%Payment%'
        AND t.deleted_at IS NULL
      ORDER BY t.transaction_date
      LIMIT 5`
    );
    
    console.log(`\nTransactions with 'Payment' in description: ${paymentLikeTransactions.length}`);
    if (paymentLikeTransactions.length > 0) {
      paymentLikeTransactions.forEach(tx => {
        console.log(`  ${tx.transaction_type}: ${tx.description} - $${tx.amount} (${tx.transaction_date})`);
      });
    }
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

main();
