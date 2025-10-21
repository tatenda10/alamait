const db = require('../src/services/db');

async function debug() {
  const conn = await db.getConnection();
  try {
    console.log('Debugging Trial Balance Query...\n');
    
    // Check if Accounts Receivable exists in chart_of_accounts
    console.log('1. Checking Accounts Receivable in chart_of_accounts:');
    const [[arCoa]] = await conn.query(`
      SELECT code, name, type, deleted_at 
      FROM chart_of_accounts 
      WHERE code = '10005'
    `);
    
    if (arCoa) {
      console.log(`   Found: ${arCoa.code} - ${arCoa.name} (${arCoa.type}) - Deleted: ${arCoa.deleted_at}`);
    } else {
      console.log('   NOT FOUND in chart_of_accounts!');
    }
    
    // Check if it exists in current_account_balances
    console.log('\n2. Checking Accounts Receivable in current_account_balances:');
    const [[arBal]] = await conn.query(`
      SELECT account_code, account_name, current_balance 
      FROM current_account_balances 
      WHERE account_code = '10005'
    `);
    
    if (arBal) {
      console.log(`   Found: ${arBal.account_code} - ${arBal.account_name} - Balance: $${arBal.current_balance}`);
    } else {
      console.log('   NOT FOUND in current_account_balances!');
    }
    
    // Test the exact JOIN query
    console.log('\n3. Testing the JOIN query:');
    const [joinResult] = await conn.query(`
      SELECT 
        coa.code,
        coa.name,
        coa.type,
        cab.current_balance,
        cab.account_code as cab_code
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.code = '10005'
    `);
    
    if (joinResult.length > 0) {
      const row = joinResult[0];
      console.log(`   JOIN Result: ${row.code} - ${row.name} (${row.type})`);
      console.log(`   Balance: $${row.current_balance}`);
      console.log(`   CAB Code: ${row.cab_code}`);
    } else {
      console.log('   JOIN returned no results!');
    }
    
    // Test the full trial balance query for just this account
    console.log('\n4. Testing full trial balance query for Accounts Receivable:');
    const [trialResult] = await conn.query(`
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        COALESCE(cab.current_balance, 0) as current_balance,
        CASE 
          WHEN coa.type IN ('Asset', 'Expense') AND COALESCE(cab.current_balance, 0) > 0 THEN 
            COALESCE(cab.current_balance, 0)
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND COALESCE(cab.current_balance, 0) < 0 THEN 
            ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as debit_balance,
        CASE 
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND COALESCE(cab.current_balance, 0) > 0 THEN 
            COALESCE(cab.current_balance, 0)
          WHEN coa.type IN ('Asset', 'Expense') AND COALESCE(cab.current_balance, 0) < 0 THEN 
            ABS(COALESCE(cab.current_balance, 0))
          ELSE 0
        END as credit_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.deleted_at IS NULL
      AND coa.code = '10005'
    `);
    
    if (trialResult.length > 0) {
      const row = trialResult[0];
      console.log(`   Trial Balance Result:`);
      console.log(`     Code: ${row.account_code}`);
      console.log(`     Name: ${row.account_name}`);
      console.log(`     Type: ${row.account_type}`);
      console.log(`     Current Balance: $${row.current_balance}`);
      console.log(`     Debit Balance: $${row.debit_balance}`);
      console.log(`     Credit Balance: $${row.credit_balance}`);
    } else {
      console.log('   Trial balance query returned no results!');
    }
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

debug();

