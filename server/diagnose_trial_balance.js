const mysql = require('mysql2/promise');
require('dotenv').config();

async function diagnoseTrialBalance() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Diagnosing Trial Balance Issues...\n');

    // 1. Check if all journal entries balance (each transaction should have equal debits and credits)
    console.log('1️⃣ Checking journal entry balance per transaction...');
    const [journalCheck] = await connection.query(`
      SELECT 
        t.id as transaction_id,
        t.transaction_date,
        t.transaction_type,
        t.status,
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) - 
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as difference
      FROM transactions t
      JOIN journal_entries je ON t.id = je.transaction_id
      WHERE t.deleted_at IS NULL 
        AND je.deleted_at IS NULL
        AND t.status = 'posted'
      GROUP BY t.id, t.transaction_date, t.transaction_type, t.status
      HAVING ABS(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) - 
                 SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END)) > 0.01
      ORDER BY difference DESC
      LIMIT 10
    `);

    if (journalCheck.length > 0) {
      console.log(`❌ Found ${journalCheck.length} transactions with unbalanced journal entries:`);
      journalCheck.forEach(tx => {
        console.log(`   Transaction ${tx.transaction_id}: Debits=${tx.total_debits}, Credits=${tx.total_credits}, Diff=${tx.difference}`);
      });
    } else {
      console.log('✅ All transactions have balanced journal entries\n');
    }

    // 2. Check total debits vs credits across all journal entries
    console.log('2️⃣ Checking total debits vs credits across all journal entries...');
    const [totalCheck] = await connection.query(`
      SELECT 
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END) - 
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as difference
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      WHERE je.deleted_at IS NULL 
        AND t.deleted_at IS NULL
        AND t.status = 'posted'
    `);

    const totalDebits = parseFloat(totalCheck[0].total_debits || 0);
    const totalCredits = parseFloat(totalCheck[0].total_credits || 0);
    const difference = totalDebits - totalCredits;

    console.log(`   Total Debits: ${totalDebits.toFixed(2)}`);
    console.log(`   Total Credits: ${totalCredits.toFixed(2)}`);
    console.log(`   Difference: ${difference.toFixed(2)}`);
    
    if (Math.abs(difference) < 0.01) {
      console.log('✅ Journal entries are balanced\n');
    } else {
      console.log(`❌ Journal entries are NOT balanced! Difference: ${difference.toFixed(2)}\n`);
    }

    // 3. Check current_account_balances vs calculated balances from journal entries
    console.log('3️⃣ Comparing current_account_balances with calculated balances...');
    const [balanceComparison] = await connection.query(`
      SELECT 
        coa.id,
        coa.code,
        coa.name,
        coa.type,
        COALESCE(cab.current_balance, 0) as stored_balance,
        COALESCE(calc.calculated_balance, 0) as calculated_balance,
        COALESCE(cab.current_balance, 0) - COALESCE(calc.calculated_balance, 0) as difference
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.id = cab.account_id
      LEFT JOIN (
        SELECT 
          je.account_id,
          SUM(
            CASE 
              WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'debit' THEN je.amount
              WHEN coa.type IN ('Asset', 'Expense') AND je.entry_type = 'credit' THEN -je.amount
              WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'credit' THEN je.amount
              WHEN coa.type IN ('Liability', 'Equity', 'Revenue') AND je.entry_type = 'debit' THEN -je.amount
              ELSE 0
            END
          ) as calculated_balance
        FROM journal_entries je
        JOIN transactions t ON je.transaction_id = t.id
        JOIN chart_of_accounts coa ON je.account_id = coa.id
        WHERE je.deleted_at IS NULL 
          AND t.deleted_at IS NULL
          AND t.status = 'posted'
          AND coa.deleted_at IS NULL
        GROUP BY je.account_id
      ) calc ON coa.id = calc.account_id
      WHERE coa.deleted_at IS NULL
        AND ABS(COALESCE(cab.current_balance, 0) - COALESCE(calc.calculated_balance, 0)) > 0.01
      ORDER BY ABS(COALESCE(cab.current_balance, 0) - COALESCE(calc.calculated_balance, 0)) DESC
      LIMIT 20
    `);

    if (balanceComparison.length > 0) {
      console.log(`❌ Found ${balanceComparison.length} accounts with mismatched balances:`);
      balanceComparison.forEach(acc => {
        const diff = parseFloat(acc.difference || 0);
        console.log(`   ${acc.code} - ${acc.name}: Stored=${acc.stored_balance}, Calculated=${acc.calculated_balance}, Diff=${diff.toFixed(2)}`);
      });
    } else {
      console.log('✅ All account balances match calculated balances\n');
    }

    // 4. Check for accounts in COA that are missing from current_account_balances
    console.log('4️⃣ Checking for missing accounts in current_account_balances...');
    const [missingAccounts] = await connection.query(`
      SELECT 
        coa.id,
        coa.code,
        coa.name,
        coa.type,
        COUNT(je.id) as journal_entry_count
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.id = cab.account_id
      LEFT JOIN journal_entries je ON coa.id = je.account_id 
        AND je.deleted_at IS NULL
        AND EXISTS (
          SELECT 1 FROM transactions t 
          WHERE t.id = je.transaction_id 
            AND t.deleted_at IS NULL 
            AND t.status = 'posted'
        )
      WHERE coa.deleted_at IS NULL
        AND cab.id IS NULL
      GROUP BY coa.id, coa.code, coa.name, coa.type
      HAVING COUNT(je.id) > 0
    `);

    if (missingAccounts.length > 0) {
      console.log(`⚠️  Found ${missingAccounts.length} accounts with journal entries but missing from current_account_balances:`);
      missingAccounts.forEach(acc => {
        console.log(`   ${acc.code} - ${acc.name} (${acc.journal_entry_count} entries)`);
      });
    } else {
      console.log('✅ All accounts with journal entries are in current_account_balances\n');
    }

    // 5. Check trial balance calculation
    console.log('5️⃣ Calculating trial balance using current_account_balances...');
    const [trialBalance] = await connection.query(`
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
    `);

    const tbDebits = trialBalance.reduce((sum, row) => sum + parseFloat(row.debit_balance || 0), 0);
    const tbCredits = trialBalance.reduce((sum, row) => sum + parseFloat(row.credit_balance || 0), 0);
    const tbDifference = tbDebits - tbCredits;

    console.log(`   Trial Balance Debits: ${tbDebits.toFixed(2)}`);
    console.log(`   Trial Balance Credits: ${tbCredits.toFixed(2)}`);
    console.log(`   Difference: ${tbDifference.toFixed(2)}`);

    if (Math.abs(tbDifference) < 0.01) {
      console.log('✅ Trial balance is balanced!\n');
    } else {
      console.log(`❌ Trial balance is NOT balanced! Difference: ${tbDifference.toFixed(2)}\n`);
    }

    // 6. Check for join mismatch issue (coa.code vs cab.account_code)
    console.log('6️⃣ Checking for JOIN mismatch (coa.code vs cab.account_code)...');
    const [joinCheck] = await connection.query(`
      SELECT 
        COUNT(DISTINCT coa.id) as coa_accounts,
        COUNT(DISTINCT cab.account_id) as cab_accounts,
        COUNT(DISTINCT CASE WHEN cab.id IS NOT NULL THEN coa.id END) as matched_accounts
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.deleted_at IS NULL
    `);

    console.log(`   COA Accounts: ${joinCheck[0].coa_accounts}`);
    console.log(`   CAB Accounts (by code): ${joinCheck[0].cab_accounts}`);
    console.log(`   Matched Accounts: ${joinCheck[0].matched_accounts}`);

    // Check if using account_id instead of account_code would match better
    const [joinCheckById] = await connection.query(`
      SELECT 
        COUNT(DISTINCT coa.id) as coa_accounts,
        COUNT(DISTINCT cab.account_id) as cab_accounts,
        COUNT(DISTINCT CASE WHEN cab.id IS NOT NULL THEN coa.id END) as matched_accounts
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.id = cab.account_id
      WHERE coa.deleted_at IS NULL
    `);

    console.log(`   Using account_id match: ${joinCheckById[0].matched_accounts}`);

    if (joinCheck[0].matched_accounts !== joinCheckById[0].matched_accounts) {
      console.log(`⚠️  JOIN mismatch detected! Using account_id instead of account_code would match ${joinCheckById[0].matched_accounts - joinCheck[0].matched_accounts} more accounts\n`);
    } else {
      console.log('✅ JOIN condition is correct\n');
    }

    // 7. Check for Petty Cash balance issue (it should come from petty_cash_accounts table)
    console.log('7️⃣ Checking Petty Cash balance...');
    const [pettyCashCOA] = await connection.query(`
      SELECT 
        coa.id,
        coa.code,
        coa.name,
        COALESCE(cab.current_balance, 0) as coa_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.id = cab.account_id
      WHERE coa.code = '10001' AND coa.deleted_at IS NULL
    `);

    const [pettyCashActual] = await connection.query(`
      SELECT COALESCE(SUM(current_balance), 0) as total_balance
      FROM petty_cash_accounts
      WHERE deleted_at IS NULL AND status = 'active'
    `);

    if (pettyCashCOA.length > 0) {
      console.log(`   COA Balance (10001): ${pettyCashCOA[0].coa_balance}`);
      console.log(`   Actual Petty Cash (sum of user accounts): ${pettyCashActual[0].total_balance}`);
      const pettyCashDiff = pettyCashCOA[0].coa_balance - pettyCashActual[0].total_balance;
      if (Math.abs(pettyCashDiff) > 0.01) {
        console.log(`   ⚠️  Petty Cash mismatch: ${pettyCashDiff.toFixed(2)}\n`);
      } else {
        console.log('✅ Petty Cash balances match\n');
      }
    }

    console.log('\n✅ Diagnosis complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

diagnoseTrialBalance();

