const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Checking current petty cash balance...');
    
    const [[currentBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10001'"
    );
    console.log(`Current Petty Cash balance: $${currentBalance?.current_balance || 0}`);
    console.log(`Expected: $21.08`);
    
    const difference = 21.08 - parseFloat(currentBalance?.current_balance || 0);
    console.log(`Difference to add: $${difference.toFixed(2)}`);
    
    if (Math.abs(difference) < 0.01) {
      console.log('✅ Petty cash balance is already correct!');
      conn.release();
      process.exit(0);
    }
    
    console.log('\nStep 2: Adding missing petty cash transactions...');
    
    // Get required IDs
    const [[user]] = await conn.query("SELECT id FROM users WHERE LOWER(username) = 'marko' AND deleted_at IS NULL");
    const [[house]] = await conn.query("SELECT id FROM boarding_houses WHERE LOWER(name) = 'st kilda' AND deleted_at IS NULL");
    const [[pettyCashAccount]] = await conn.query("SELECT id FROM chart_of_accounts WHERE code = '10001' AND deleted_at IS NULL");
    const [[equityAccount]] = await conn.query("SELECT id FROM chart_of_accounts WHERE code = '30004' AND deleted_at IS NULL");
    
    if (!user || !house || !pettyCashAccount || !equityAccount) {
      throw new Error('Required accounts or user not found');
    }
    
    console.log(`User ID: ${user.id}, Boarding House ID: ${house.id}`);
    console.log(`Petty Cash Account ID: ${pettyCashAccount.id}`);
    console.log(`Equity Account ID: ${equityAccount.id}`);
    
    await conn.beginTransaction();
    
    // Add opening balance transaction
    const openingBalanceRef = `PC-OPENING-${Date.now()}`;
    console.log(`Adding opening balance: $${difference.toFixed(2)}`);
    
    // Create opening balance transaction
    const [txResult] = await conn.query(
      `INSERT INTO transactions (
        transaction_type, boarding_house_id, reference, amount, currency, 
        description, transaction_date, created_by, created_at, status
      ) VALUES (?, ?, ?, ?, 'USD', ?, '2025-08-31', ?, NOW(), 'posted')`,
      ['opening_balance', house.id, openingBalanceRef, difference, `Opening balance - Marko petty cash St Kilda`, user.id]
    );
    const txId = txResult.insertId;
    
    // Create journal entries for opening balance
    // Debit Petty Cash, Credit Opening Balance Equity
    await conn.query(
      `INSERT INTO journal_entries (
        transaction_id, account_id, entry_type, amount, description, 
        boarding_house_id, created_by, created_at
      ) VALUES (?, ?, 'debit', ?, ?, ?, ?, NOW())`,
      [txId, pettyCashAccount.id, difference, `Opening balance - Marko petty cash St Kilda - Debit`, house.id, user.id]
    );
    
    await conn.query(
      `INSERT INTO journal_entries (
        transaction_id, account_id, entry_type, amount, description, 
        boarding_house_id, created_by, created_at
      ) VALUES (?, ?, 'credit', ?, ?, ?, ?, NOW())`,
      [txId, equityAccount.id, difference, `Opening balance - Marko petty cash St Kilda - Credit`, house.id, user.id]
    );
    
    await conn.commit();
    
    console.log('\nStep 3: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    // Verify the fix
    console.log('\nStep 4: Verifying petty cash balance...');
    const [[finalPettyCashBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10001'"
    );
    
    console.log(`Final Petty Cash balance: $${finalPettyCashBalance?.current_balance || 0}`);
    console.log(`Expected: $21.08`);
    console.log(`Match: ${Math.abs(parseFloat(finalPettyCashBalance?.current_balance || 0) - 21.08) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n✅ Petty cash balance fixed!');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Fix failed:', e);
    console.error('Stack:', e.stack);
    conn.release();
    process.exit(1);
  }
}

main();
