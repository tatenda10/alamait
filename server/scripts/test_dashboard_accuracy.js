const db = require('../src/services/db');

async function testDashboardAccuracy() {
  const conn = await db.getConnection();
  try {
    console.log('🧪 Testing Dashboard Accuracy...\n');

    // Test 1: Check KPI data accuracy
    console.log('1️⃣ Testing KPI Data:');
    
    // Cash position (sum of all cash accounts)
    const [cashResult] = await conn.query(`
      SELECT COALESCE(SUM(cab.current_balance), 0) as cash_position
      FROM current_account_balances cab
      JOIN chart_of_accounts coa ON cab.account_id = coa.id
      WHERE coa.code IN ('10001', '10002', '10003', '10004')
        AND coa.deleted_at IS NULL
    `);
    
    // Accounts receivable
    const [arResult] = await conn.query(`
      SELECT COALESCE(SUM(cab.current_balance), 0) as accounts_receivable
      FROM current_account_balances cab
      JOIN chart_of_accounts coa ON cab.account_id = coa.id
      WHERE coa.code = '10005'
        AND coa.deleted_at IS NULL
    `);
    
    // Accounts payable
    const [apResult] = await conn.query(`
      SELECT COALESCE(SUM(cab.current_balance), 0) as accounts_payable
      FROM current_account_balances cab
      JOIN chart_of_accounts coa ON cab.account_id = coa.id
      WHERE coa.code LIKE '2%'
        AND coa.deleted_at IS NULL
    `);
    
    const cashPosition = parseFloat(cashResult[0].cash_position);
    const accountsReceivable = Math.abs(parseFloat(arResult[0].accounts_receivable));
    const accountsPayable = parseFloat(apResult[0].accounts_payable);
    const workingCapital = cashPosition + accountsReceivable - accountsPayable;
    
    console.log(`  💰 Cash Position: $${cashPosition.toFixed(2)}`);
    console.log(`  📊 Accounts Receivable: $${accountsReceivable.toFixed(2)}`);
    console.log(`  💳 Accounts Payable: $${accountsPayable.toFixed(2)}`);
    console.log(`  📈 Working Capital: $${workingCapital.toFixed(2)}`);

    // Test 2: Check petty cash balances
    console.log('\n2️⃣ Testing Petty Cash Balances:');
    
    const [pettyCashResult] = await conn.query(`
      SELECT 
        bh.name as location,
        COALESCE(SUM(cab.current_balance), 0) as balance
      FROM boarding_houses bh
      LEFT JOIN users u ON bh.id = u.boarding_house_id AND u.role = 'petty_cash_user' AND u.deleted_at IS NULL
      LEFT JOIN current_account_balances cab ON u.id = cab.user_id
      WHERE bh.deleted_at IS NULL
      GROUP BY bh.id, bh.name
      ORDER BY bh.name
    `);
    
    console.log('  Petty Cash by Location:');
    pettyCashResult.forEach(item => {
      console.log(`    ${item.location}: $${parseFloat(item.balance).toFixed(2)}`);
    });

    // Test 3: Check individual account balances
    console.log('\n3️⃣ Testing Individual Account Balances:');
    
    const [accountBalances] = await conn.query(`
      SELECT 
        coa.code,
        coa.name,
        cab.current_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.id = cab.account_id
      WHERE coa.code IN ('10001', '10002', '10003', '10004', '10005')
        AND coa.deleted_at IS NULL
      ORDER BY coa.code
    `);
    
    console.log('  Key Account Balances:');
    accountBalances.forEach(acc => {
      console.log(`    ${acc.code}: ${acc.name} - $${parseFloat(acc.current_balance || 0).toFixed(2)}`);
    });

    // Test 4: Verify trial balance is still balanced
    console.log('\n4️⃣ Verifying Trial Balance:');
    
    const [journalTotals] = await conn.query(
      `SELECT 
        SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) as total_credits
      FROM journal_entries 
      WHERE deleted_at IS NULL`
    );
    
    const totalDebits = parseFloat(journalTotals[0]?.total_debits || 0);
    const totalCredits = parseFloat(journalTotals[0]?.total_credits || 0);
    const difference = totalDebits - totalCredits;
    
    console.log(`  Total Debits: $${totalDebits.toFixed(2)}`);
    console.log(`  Total Credits: $${totalCredits.toFixed(2)}`);
    console.log(`  Difference: $${difference.toFixed(2)}`);
    console.log(`  Balanced: ${Math.abs(difference) < 0.01 ? '✅ YES' : '❌ NO'}`);

    console.log('\n✅ Dashboard accuracy test completed!');
    console.log('📊 All data should now be real-time and accurate in the dashboard.');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Test failed:', e);
    conn.release();
    process.exit(1);
  }
}

testDashboardAccuracy();
