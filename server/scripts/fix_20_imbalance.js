const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function fix() {
  const conn = await db.getConnection();
  try {
    console.log('Creating $20 balancing entry...\n');
    
    await conn.beginTransaction();
    
    // Get account IDs
    const [[cashAcct]] = await conn.query("SELECT id FROM chart_of_accounts WHERE code = '10002' AND deleted_at IS NULL");
    const [[equityAcct]] = await conn.query("SELECT id FROM chart_of_accounts WHERE code = '30004' AND deleted_at IS NULL");
    
    if (!cashAcct || !equityAcct) {
      throw new Error('Required accounts not found');
    }
    
    // Create transaction
    const txRef = 'BALANCE-FIX-20';
    const [txResult] = await conn.query(
      `INSERT INTO transactions (
        transaction_type, reference, amount, currency, description, 
        transaction_date, boarding_house_id, created_by, created_at, status
      ) VALUES ('opening_balance', ?, ?, 'USD', ?, CURDATE(), 1, 1, NOW(), 'posted')`,
      [txRef, 20.00, 'Balancing entry - fix $20 imbalance']
    );
    const txId = txResult.insertId;
    
    // Create balancing journal entries
    // Credit Cash (reduce the extra $20 we have in journal entries)
    await conn.query(
      `INSERT INTO journal_entries (
        transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at
      ) VALUES (?, ?, 'credit', ?, ?, 1, 1, NOW())`,
      [txId, cashAcct.id, 20.00, 'Balancing entry - Credit Cash']
    );
    
    // Debit Opening Balance Equity (to balance)
    await conn.query(
      `INSERT INTO journal_entries (
        transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at
      ) VALUES (?, ?, 'debit', ?, ?, 1, 1, NOW())`,
      [txId, equityAcct.id, 20.00, 'Balancing entry - Debit Equity']
    );
    
    await conn.commit();
    
    console.log('✅ Created balancing entry');
    console.log('Transaction ID:', txId);
    console.log('Reference:', txRef);
    
    console.log('\nRecalculating balances...');
    await recalculateAllAccountBalances();
    
    // Check if balanced now
    const [[jeCheck]] = await conn.query(`
      SELECT 
        SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) as total_credits
      FROM journal_entries
      WHERE deleted_at IS NULL
    `);
    
    console.log(`\nJournal Entries - Debits: $${parseFloat(jeCheck.total_debits).toFixed(2)}`);
    console.log(`Journal Entries - Credits: $${parseFloat(jeCheck.total_credits).toFixed(2)}`);
    console.log(`Difference: $${(parseFloat(jeCheck.total_debits) - parseFloat(jeCheck.total_credits)).toFixed(2)}`);
    
    if (Math.abs(parseFloat(jeCheck.total_debits) - parseFloat(jeCheck.total_credits)) < 0.01) {
      console.log('\n✅ Trial balance is now BALANCED!');
    } else {
      console.log('\n⚠️ Still not balanced');
    }
    
    conn.release();
    process.exit(0);
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    console.error('❌ Error:', e);
    conn.release();
    process.exit(1);
  }
}

fix();

