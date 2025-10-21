const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Getting St Kilda and account info...');
    const [[house]] = await conn.query("SELECT id FROM boarding_houses WHERE LOWER(name) = 'st kilda' AND deleted_at IS NULL");
    
    if (!house) {
      throw new Error('St Kilda not found');
    }
    
    // Get COA account IDs
    const [[vaultAcct]] = await conn.query("SELECT id FROM chart_of_accounts WHERE code = '10004' AND deleted_at IS NULL");
    const [[equityAcct]] = await conn.query("SELECT id FROM chart_of_accounts WHERE code = '30004' AND deleted_at IS NULL");
    
    if (!vaultAcct || !equityAcct) {
      throw new Error('Required accounts not found');
    }
    
    console.log(`St Kilda ID: ${house.id}`);
    console.log(`CBZ Vault ID: ${vaultAcct.id}`);
    console.log(`Opening Balance Equity ID: ${equityAcct.id}`);
    
    // Check current vault balance
    console.log('\nStep 2: Checking current CBZ Vault balance...');
    const [[currentBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10004'"
    );
    console.log(`Current CBZ Vault balance: $${currentBalance?.current_balance || 0}`);
    
    await conn.beginTransaction();
    
    console.log('\nStep 3: Adding CBZ Vault opening balance...');
    const txRef = 'VAULT-STK-OPENING-2025-09';
    const amount = 1280.00;
    const date = '2025-09-01';
    
    // Create transaction
    const [txResult] = await conn.query(
      `INSERT INTO transactions (
        transaction_type, boarding_house_id, reference, amount, currency, 
        description, transaction_date, created_by, created_at, status
      ) VALUES ('opening_balance', ?, ?, ?, 'USD', ?, ?, 1, NOW(), 'posted')`,
      [house.id, txRef, amount, 'Opening balance - CBZ Vault St Kilda', date]
    );
    const txId = txResult.insertId;
    
    // Debit: CBZ Vault
    await conn.query(
      `INSERT INTO journal_entries (
        transaction_id, account_id, entry_type, amount, description, 
        boarding_house_id, created_by, created_at
      ) VALUES (?, ?, 'debit', ?, ?, ?, 1, NOW())`,
      [txId, vaultAcct.id, amount, 'Opening balance - Debit CBZ Vault', house.id]
    );
    
    // Credit: Opening Balance Equity
    await conn.query(
      `INSERT INTO journal_entries (
        transaction_id, account_id, entry_type, amount, description, 
        boarding_house_id, created_by, created_at
      ) VALUES (?, ?, 'credit', ?, ?, ?, 1, NOW())`,
      [txId, equityAcct.id, amount, 'Opening balance - Credit Equity', house.id]
    );
    
    await conn.commit();
    
    console.log('✅ Opening balance transaction created');
    
    console.log('\nStep 4: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    // Verify final balance
    const [[finalBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10004'"
    );
    
    console.log('\n=== Summary ===');
    console.log(`Opening balance added: $${amount}`);
    console.log(`Previous balance: $${currentBalance?.current_balance || 0}`);
    console.log(`New CBZ Vault balance: $${finalBalance?.current_balance || 0}`);
    
    console.log('\n✅ CBZ Vault opening balance added successfully!');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    console.error('❌ Error:', e);
    console.error('Stack:', e.stack);
    conn.release();
    process.exit(1);
  }
}

main();

