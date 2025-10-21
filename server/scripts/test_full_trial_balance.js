const db = require('../src/services/db');

async function test() {
  const conn = await db.getConnection();
  try {
    console.log('Testing Full Trial Balance Query...\n');
    
    const query = `
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
      ORDER BY coa.code
    `;
    
    const [rows] = await conn.query(query);
    
    console.log(`Total accounts returned: ${rows.length}\n`);
    
    // Look for Accounts Receivable specifically
    const ar = rows.find(row => row.account_code === '10005');
    if (ar) {
      console.log('✅ Accounts Receivable found in results:');
      console.log(`   Code: ${ar.account_code}`);
      console.log(`   Name: ${ar.account_name}`);
      console.log(`   Type: ${ar.account_type}`);
      console.log(`   Current Balance: $${ar.current_balance}`);
      console.log(`   Debit Balance: $${ar.debit_balance}`);
      console.log(`   Credit Balance: $${ar.credit_balance}`);
    } else {
      console.log('❌ Accounts Receivable NOT found in results!');
    }
    
    // Show all accounts with non-zero balances
    console.log('\nAll accounts with non-zero balances:');
    const nonZero = rows.filter(row => 
      parseFloat(row.debit_balance || 0) > 0 || parseFloat(row.credit_balance || 0) > 0
    );
    
    console.log(`Found ${nonZero.length} accounts with non-zero balances:\n`);
    nonZero.forEach(row => {
      const debit = parseFloat(row.debit_balance || 0);
      const credit = parseFloat(row.credit_balance || 0);
      const balance = parseFloat(row.current_balance || 0);
      
      console.log(`${row.account_code} - ${row.account_name} (${row.account_type})`);
      console.log(`  Current: $${balance.toFixed(2)} | Debit: $${debit.toFixed(2)} | Credit: $${credit.toFixed(2)}`);
      console.log('');
    });
    
    // Calculate totals
    const totalDebits = rows.reduce((sum, row) => sum + parseFloat(row.debit_balance || 0), 0);
    const totalCredits = rows.reduce((sum, row) => sum + parseFloat(row.credit_balance || 0), 0);
    
    console.log('='.repeat(60));
    console.log(`TOTAL DEBITS: $${totalDebits.toFixed(2)}`);
    console.log(`TOTAL CREDITS: $${totalCredits.toFixed(2)}`);
    console.log(`DIFFERENCE: $${(totalDebits - totalCredits).toFixed(2)}`);
    console.log(`BALANCED: ${Math.abs(totalDebits - totalCredits) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

test();

