const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function reenterPaymentJournals() {
  const conn = await db.getConnection();
  try {
    console.log('📝 Re-entering payment journal entries (excluding PAYMENT 1 column amounts)...\n');

    // PAYMENT 1 column amounts to exclude (exact amounts from the image)
    const payment1Amounts = [
      180.00, 130.00, 150.00, 170.00, 120.00, 100.00, 70.00, 190.00, 20.00, 240.00,
      95.00, 100.00, 60.00, 65.00, 540.00, 210.00, 220.00, 200.00, 160.00, 150.00
    ];

    // Get payment transactions excluding PAYMENT 1 amounts
    const placeholders = payment1Amounts.map(() => '?').join(',');
    const [paymentTransactions] = await conn.query(
      `SELECT id, amount, description, transaction_date
       FROM transactions 
       WHERE transaction_type = 'payment' 
         AND amount NOT IN (${placeholders})
         AND deleted_at IS NULL
       ORDER BY id`,
      payment1Amounts
    );

    console.log(`📊 Found ${paymentTransactions.length} payment transactions to create journal entries for`);
    console.log(`🚫 Excluding ${payment1Amounts.length} PAYMENT 1 amounts: [${payment1Amounts.join(', ')}]`);

    if (paymentTransactions.length === 0) {
      console.log('✅ No payment transactions found to create journal entries for');
      conn.release();
      process.exit(0);
    }

    // Get account IDs
    const [cashAccount] = await conn.query(
      `SELECT id FROM chart_of_accounts WHERE code = '10002' AND deleted_at IS NULL`
    );
    const [arAccount] = await conn.query(
      `SELECT id FROM chart_of_accounts WHERE code = '10005' AND deleted_at IS NULL`
    );

    if (!cashAccount[0] || !arAccount[0]) {
      console.log('❌ Could not find Cash or Accounts Receivable accounts');
      conn.release();
      process.exit(1);
    }

    const cashAccountId = cashAccount[0].id;
    const arAccountId = arAccount[0].id;

    // Get a default boarding house ID (use the first one available)
    const [boardingHouses] = await conn.query(
      `SELECT id FROM boarding_houses WHERE deleted_at IS NULL LIMIT 1`
    );
    
    if (!boardingHouses[0]) {
      console.log('❌ Could not find any boarding house');
      conn.release();
      process.exit(1);
    }

    const defaultBoardingHouseId = boardingHouses[0].id;

    console.log(`💰 Cash Account ID: ${cashAccountId}`);
    console.log(`📊 Accounts Receivable ID: ${arAccountId}`);
    console.log(`🏠 Default Boarding House ID: ${defaultBoardingHouseId}`);

    // Create journal entries for each payment transaction
    let createdEntries = 0;
    const journalEntries = [];

    for (const transaction of paymentTransactions) {
      // Debit Cash
      journalEntries.push({
        transaction_id: transaction.id,
        account_id: cashAccountId,
        boarding_house_id: defaultBoardingHouseId,
        entry_type: 'debit',
        amount: parseFloat(transaction.amount),
        description: `Payment received - Debit Cash - ${transaction.description?.replace('Payment from ', '') || 'Student Payment'}`,
        created_at: '2025-09-01 00:00:00'
      });

      // Credit Accounts Receivable
      journalEntries.push({
        transaction_id: transaction.id,
        account_id: arAccountId,
        boarding_house_id: defaultBoardingHouseId,
        entry_type: 'credit',
        amount: parseFloat(transaction.amount),
        description: `Payment received - Credit Receivable - ${transaction.description?.replace('Payment from ', '') || 'Student Payment'}`,
        created_at: '2025-09-01 00:00:00'
      });

      createdEntries += 2;
    }

    console.log(`\n📝 Creating ${journalEntries.length} journal entries...`);

    // Insert journal entries in batches
    const batchSize = 100;
    for (let i = 0; i < journalEntries.length; i += batchSize) {
      const batch = journalEntries.slice(i, i + batchSize);
      
      for (const entry of batch) {
        await conn.query(
          `INSERT INTO journal_entries 
           (transaction_id, account_id, boarding_house_id, entry_type, amount, description, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [entry.transaction_id, entry.account_id, entry.boarding_house_id, entry.entry_type, entry.amount, entry.description, entry.created_at]
        );
      }
      
      console.log(`   Created ${Math.min(i + batchSize, journalEntries.length)}/${journalEntries.length} entries...`);
    }

    console.log(`✅ Created ${createdEntries} journal entries`);

    // Recalculate balances
    console.log('\n🔄 Recalculating account balances...');
    await recalculateAllAccountBalances();

    // Check trial balance
    console.log('\n📊 Checking trial balance...');
    const [journalTotals] = await conn.query(
      `SELECT 
        SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) as total_credits
      FROM journal_entries 
      WHERE deleted_at IS NULL`
    );

    const totalDebits = parseFloat(journalTotals[0]?.total_debits || 0);
    const totalCredits = parseFloat(journalTotals[0]?.total_credits || 0);
    const difference = totalDebits - totalCredits;

    console.log(`Trial Balance:`);
    console.log(`  Total Debits: $${totalDebits.toFixed(2)}`);
    console.log(`  Total Credits: $${totalCredits.toFixed(2)}`);
    console.log(`  Difference: $${difference.toFixed(2)}`);
    console.log(`  Balanced: ${Math.abs(difference) < 0.01 ? '✅ YES' : '❌ NO'}`);

    // Show summary
    console.log('\n📊 Summary:');
    console.log(`  Payment transactions processed: ${paymentTransactions.length}`);
    console.log(`  Journal entries created: ${createdEntries}`);
    console.log(`  Excluded PAYMENT 1 amounts: ${payment1Amounts.length}`);
    console.log(`  Date: September 1, 2025`);

    console.log('\n✅ Payment journal entries re-entered successfully!');
    console.log('📝 Excluded PAYMENT 1 column amounts as requested');

    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    conn.release();
    process.exit(1);
  }
}

reenterPaymentJournals();
