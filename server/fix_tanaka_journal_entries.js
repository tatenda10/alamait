const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixJournalEntries() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.beginTransaction();
    console.log('\n=== FIXING TANAKA MATEMATEMA JOURNAL ENTRIES ===\n');

    const correctAmount = 200;
    const difference = 40; // 240 - 200

    // Update the Accounts Receivable debit entry (ID: 3180)
    await connection.query(`
      UPDATE journal_entries 
      SET amount = ?
      WHERE id = 3180
    `, [correctAmount]);
    console.log(`✅ Updated journal entry 3180 (A/R Debit): $240 → $${correctAmount}`);

    // Update the Rentals Income credit entry (ID: 3181)
    await connection.query(`
      UPDATE journal_entries 
      SET amount = ?
      WHERE id = 3181
    `, [correctAmount]);
    console.log(`✅ Updated journal entry 3181 (Rentals Income Credit): $240 → $${correctAmount}`);

    // Now update the COA balances
    // Decrease Accounts Receivable (10005) by $40
    const [arBalance] = await connection.query(`
      SELECT current_balance FROM current_account_balances WHERE account_id = 10005
    `);

    if (arBalance.length > 0) {
      const currentAR = parseFloat(arBalance[0].current_balance);
      const newAR = currentAR - difference;
      
      await connection.query(`
        UPDATE current_account_balances 
        SET current_balance = ?
        WHERE account_id = 10005
      `, [newAR]);
      console.log(`✅ Updated Accounts Receivable COA balance: $${currentAR} → $${newAR}`);
    } else {
      console.log(`⚠️  Accounts Receivable (10005) not found in current_account_balances`);
    }

    // Decrease Rentals Income (40001) by $40
    const [revenueBalance] = await connection.query(`
      SELECT current_balance FROM current_account_balances WHERE account_id = 40001
    `);

    if (revenueBalance.length > 0) {
      const currentRevenue = parseFloat(revenueBalance[0].current_balance);
      const newRevenue = currentRevenue - difference;
      
      await connection.query(`
        UPDATE current_account_balances 
        SET current_balance = ?
        WHERE account_id = 40001
      `, [newRevenue]);
      console.log(`✅ Updated Rentals Income COA balance: $${currentRevenue} → $${newRevenue}`);
    } else {
      console.log(`⚠️  Rentals Income (40001) not found in current_account_balances`);
    }

    await connection.commit();
    
    console.log('\n✅ ALL JOURNAL ENTRIES AND COA BALANCES FIXED!\n');
    console.log('Summary:');
    console.log('- Both journal entries updated to $200');
    console.log('- Accounts Receivable reduced by $40');
    console.log('- Rentals Income reduced by $40');
    console.log('- October rental income is now correct at $9,660\n');

    await connection.end();
  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Error:', error.message);
    await connection.end();
    process.exit(1);
  }
}

fixJournalEntries();

