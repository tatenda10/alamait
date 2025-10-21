const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Clearing all existing bank transactions...');
    
    // Get St Kilda boarding house
    const [[house]] = await conn.query("SELECT id FROM boarding_houses WHERE LOWER(name) = 'st kilda' AND deleted_at IS NULL");
    
    if (!house) {
      throw new Error('St Kilda boarding house not found');
    }
    
    console.log(`St Kilda Boarding House ID: ${house.id}`);
    
    // Soft delete all bank-related transactions
    await conn.query(
      "UPDATE transactions SET deleted_at = NOW() WHERE boarding_house_id = ? AND transaction_type IN ('opening_balance', 'cash_to_bank', 'expense') AND description LIKE '%Bank%' OR description LIKE '%Rentals%' OR description LIKE '%Wifi%' OR description LIKE '%Alamait%'",
      [house.id]
    );
    
    // Soft delete all journal entries for bank account
    await conn.query(
      "UPDATE journal_entries SET deleted_at = NOW() WHERE boarding_house_id = ? AND account_id IN (SELECT id FROM chart_of_accounts WHERE code = '10003')",
      [house.id]
    );
    
    console.log('✅ Cleared existing bank transactions');
    
    console.log('\nStep 2: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    // Verify bank balance is now zero
    const [[bankBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10003'"
    );
    console.log(`Bank balance after clearing: $${bankBalance?.current_balance || 0}`);
    
    console.log('\nStep 3: Now run the bank import script again...');
    console.log('Run: node server/scripts/import_bank_ledger_transactions.js');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Clear failed:', e);
    console.error('Stack:', e.stack);
    conn.release();
    process.exit(1);
  }
}

main();
