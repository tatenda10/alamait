const db = require('../src/services/db');

async function check() {
  const conn = await db.getConnection();
  try {
    console.log('Checking for missing accounts in trial balance...\n');
    
    // Check which accounts are in chart_of_accounts but not in current_account_balances
    const [missing] = await conn.query(`
      SELECT 
        coa.code,
        coa.name,
        coa.type,
        cab.current_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.deleted_at IS NULL
      AND cab.account_code IS NULL
    `);
    
    if (missing.length > 0) {
      console.log(`Found ${missing.length} accounts missing from current_account_balances:\n`);
      missing.forEach(acc => {
        console.log(`  ${acc.code} - ${acc.name} (${acc.type})`);
      });
    } else {
      console.log('All accounts have balance records.');
    }
    
    // Check specifically for Accounts Receivable
    console.log('\nChecking Accounts Receivable (10005):');
    const [[ar]] = await conn.query(`
      SELECT 
        coa.code,
        coa.name,
        coa.type,
        cab.current_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.code = '10005'
    `);
    
    if (ar) {
      console.log(`  Code: ${ar.code}`);
      console.log(`  Name: ${ar.name}`);
      console.log(`  Type: ${ar.type}`);
      console.log(`  Balance: $${ar.current_balance || 'NULL'}`);
    } else {
      console.log('  Accounts Receivable not found in chart_of_accounts!');
    }
    
    // Check all accounts with negative balances
    console.log('\nAccounts with negative balances:');
    const [negative] = await conn.query(`
      SELECT 
        coa.code,
        coa.name,
        coa.type,
        cab.current_balance
      FROM chart_of_accounts coa
      JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.deleted_at IS NULL
      AND cab.current_balance < 0
      ORDER BY cab.current_balance
    `);
    
    negative.forEach(acc => {
      console.log(`  ${acc.code} - ${acc.name}: $${acc.current_balance}`);
    });
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

check();

