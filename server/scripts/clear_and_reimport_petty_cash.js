const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Clearing existing petty cash data...');
    
    // Get Marko's user ID and petty cash account
    const [[user]] = await conn.query("SELECT id FROM users WHERE LOWER(username) = 'marko' AND deleted_at IS NULL");
    const [[house]] = await conn.query("SELECT id FROM boarding_houses WHERE LOWER(name) = 'st kilda' AND deleted_at IS NULL");
    const [[pettyCashAcct]] = await conn.query(
      "SELECT id FROM petty_cash_accounts WHERE user_id = ? AND boarding_house_id = ? AND deleted_at IS NULL",
      [user.id, house.id]
    );
    
    if (!user || !house || !pettyCashAcct) {
      throw new Error('User, boarding house, or petty cash account not found');
    }
    
    console.log(`Clearing data for User ID: ${user.id}, Boarding House ID: ${house.id}, Petty Cash Account ID: ${pettyCashAcct.id}`);
    
    // Soft delete existing transactions and journal entries
    await conn.query(
      "UPDATE transactions SET deleted_at = NOW() WHERE boarding_house_id = ? AND created_by = ? AND transaction_type IN ('opening_balance', 'cash_inflow', 'expense')",
      [house.id, user.id]
    );
    
    await conn.query(
      "UPDATE journal_entries SET deleted_at = NOW() WHERE boarding_house_id = ? AND created_by = ?",
      [house.id, user.id]
    );
    
    // Delete petty cash transactions (no soft delete column)
    await conn.query(
      "DELETE FROM petty_cash_transactions WHERE user_id = ? AND boarding_house_id = ?",
      [user.id, house.id]
    );
    
    // Reset petty cash account
    await conn.query(
      "UPDATE petty_cash_accounts SET current_balance = 0, beginning_balance = 0, total_inflows = 0, total_outflows = 0, updated_at = NOW() WHERE id = ?",
      [pettyCashAcct.id]
    );
    
    console.log('✅ Cleared existing petty cash data');
    
    console.log('\nStep 2: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    console.log('\nStep 3: Now run the import script again...');
    console.log('Run: node server/scripts/import_petty_cash_ledger_september.js');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    console.error('❌ Cleanup failed:', e);
    console.error('Stack:', e.stack);
    conn.release();
    process.exit(1);
  }
}

main();
