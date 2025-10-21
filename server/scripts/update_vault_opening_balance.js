const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Getting CBZ Vault account info...');
    
    // Get CBZ Vault account
    const [[vaultAccount]] = await conn.query(
      "SELECT id FROM chart_of_accounts WHERE code = '10004' AND deleted_at IS NULL"
    );
    
    if (!vaultAccount) {
      throw new Error('CBZ Vault account (10004) not found');
    }
    
    console.log(`CBZ Vault Account ID: ${vaultAccount.id}`);
    
    // Get current vault balance
    const [[currentVaultBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10004'"
    );
    console.log(`Current Vault balance: $${currentVaultBalance?.current_balance || 0}`);
    
    // Get St Kilda boarding house
    const [[house]] = await conn.query("SELECT id FROM boarding_houses WHERE LOWER(name) = 'st kilda' AND deleted_at IS NULL");
    
    if (!house) {
      throw new Error('St Kilda boarding house not found');
    }
    
    console.log(`St Kilda Boarding House ID: ${house.id}`);
    
    // Get Opening Balance Equity account
    const [[equityAccount]] = await conn.query(
      "SELECT id FROM chart_of_accounts WHERE code = '30004' AND deleted_at IS NULL"
    );
    
    if (!equityAccount) {
      throw new Error('Opening Balance Equity account (30004) not found');
    }
    
    console.log(`Opening Balance Equity Account ID: ${equityAccount.id}`);
    
    console.log('\nStep 2: Creating vault opening balance transaction...');
    
    const openingAmount = 1280.00;
    const transactionRef = `VAULT-OPENING-${new Date().getTime()}`;
    
    // Create opening balance transaction
    const [txResult] = await conn.query(
      `INSERT INTO transactions (
        transaction_type, boarding_house_id, reference, amount, currency, 
        description, transaction_date, created_by, created_at, status
      ) VALUES (?, ?, ?, ?, 'USD', ?, ?, 1, NOW(), 'posted')`,
      ['opening_balance', house.id, transactionRef, openingAmount, 'CBZ Vault opening balance - August 31, 2025', '2025-08-31']
    );
    const txId = txResult.insertId;
    
    console.log(`Created transaction ID: ${txId}`);
    
    // Create journal entries
    // Debit CBZ Vault, Credit Opening Balance Equity
    await conn.query(
      `INSERT INTO journal_entries (
        transaction_id, account_id, entry_type, amount, description, 
        boarding_house_id, created_by, created_at
      ) VALUES (?, ?, 'debit', ?, ?, ?, 1, NOW())`,
      [txId, vaultAccount.id, openingAmount, 'CBZ Vault opening balance - Debit', house.id]
    );
    
    await conn.query(
      `INSERT INTO journal_entries (
        transaction_id, account_id, entry_type, amount, description, 
        boarding_house_id, created_by, created_at
      ) VALUES (?, ?, 'credit', ?, ?, ?, 1, NOW())`,
      [txId, equityAccount.id, openingAmount, 'CBZ Vault opening balance - Credit', house.id]
    );
    
    console.log('✅ Created vault opening balance journal entries');
    
    console.log('\nStep 3: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    // Verify the new vault balance
    console.log('\nStep 4: Verifying vault balance...');
    const [[newVaultBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10004'"
    );
    
    console.log(`New CBZ Vault balance: $${newVaultBalance?.current_balance || 0}`);
    console.log(`Expected: $1,280.00`);
    console.log(`Match: ${Math.abs(parseFloat(newVaultBalance?.current_balance || 0) - 1280) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n✅ CBZ Vault opening balance added successfully!');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Update failed:', e);
    console.error('Stack:', e.stack);
    conn.release();
    process.exit(1);
  }
}

main();
