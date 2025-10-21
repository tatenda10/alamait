const db = require('../src/services/db');

async function testController() {
  const conn = await db.getConnection();
  try {
    console.log('Testing Trial Balance Controller Logic...\n');
    
    // Simulate the controller query
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
          WHEN coa.type IN ('Asset', 'Expense') AND COALESCE(cab.current_balance, 0) < 0 THEN 
            0
          ELSE 0
        END as debit_balance,
        CASE 
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND COALESCE(cab.current_balance, 0) > 0 THEN 
            COALESCE(cab.current_balance, 0)
          WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND COALESCE(cab.current_balance, 0) < 0 THEN 
            0
          ELSE 0
        END as credit_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.deleted_at IS NULL
      ORDER BY coa.code
    `;
    
    const [rows] = await conn.query(query);
    
    console.log('Trial Balance Results:\n');
    console.log('Account Code | Account Name | Type | Current Balance | Debit | Credit');
    console.log('-------------|--------------|------|-----------------|-------|-------');
    
    let totalDebits = 0;
    let totalCredits = 0;
    
    rows.forEach(row => {
      const debit = parseFloat(row.debit_balance || 0);
      const credit = parseFloat(row.credit_balance || 0);
      const balance = parseFloat(row.current_balance || 0);
      
      if (debit > 0 || credit > 0) {
        console.log(`${row.account_code.padEnd(12)} | ${row.account_name.padEnd(12)} | ${row.account_type.padEnd(4)} | $${balance.toFixed(2).padStart(15)} | $${debit.toFixed(2).padStart(5)} | $${credit.toFixed(2).padStart(6)}`);
        totalDebits += debit;
        totalCredits += credit;
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`TOTAL DEBITS: $${totalDebits.toFixed(2)}`);
    console.log(`TOTAL CREDITS: $${totalCredits.toFixed(2)}`);
    console.log(`DIFFERENCE: $${(totalDebits - totalCredits).toFixed(2)}`);
    console.log(`BALANCED: ${Math.abs(totalDebits - totalCredits) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    // Show account type breakdown
    console.log('\nAccount Type Breakdown:');
    const byType = {};
    rows.forEach(row => {
      if (!byType[row.account_type]) byType[row.account_type] = { debits: 0, credits: 0 };
      byType[row.account_type].debits += parseFloat(row.debit_balance || 0);
      byType[row.account_type].credits += parseFloat(row.credit_balance || 0);
    });
    
    for (const [type, totals] of Object.entries(byType)) {
      if (totals.debits > 0 || totals.credits > 0) {
        console.log(`  ${type}: Debits $${totals.debits.toFixed(2)}, Credits $${totals.credits.toFixed(2)}`);
      }
    }
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

testController();

