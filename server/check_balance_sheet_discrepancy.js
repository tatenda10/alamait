const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDiscrepancy() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Checking Balance Sheet Discrepancy Details...\n');

    // Get Accounts Receivable balance from journal entries
    const [arBalance] = await connection.query(`
      SELECT 
        COALESCE(
          SUM(
            CASE 
              WHEN coa.type = 'Asset' AND je.entry_type = 'debit' THEN je.amount
              WHEN coa.type = 'Asset' AND je.entry_type = 'credit' THEN -je.amount
              ELSE 0
            END
          ), 0
        ) as balance
      FROM chart_of_accounts coa
      LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
      LEFT JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL AND t.status = 'posted'
      WHERE coa.code = '10005' AND coa.deleted_at IS NULL
    `);

    // Get student debtors (negative balances)
    const [debtorsTotal] = await connection.query(`
      SELECT COALESCE(SUM(ABS(sab.current_balance)), 0) as total
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
        AND sab.current_balance < 0
        AND sab.deleted_at IS NULL
    `);

    // Get student prepayments (positive balances)
    const [prepaymentsTotal] = await connection.query(`
      SELECT COALESCE(SUM(sab.current_balance), 0) as total
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN rooms r ON se.room_id = r.id
      JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
        AND sab.current_balance > 0
        AND sab.deleted_at IS NULL
    `);

    // Get all student balances (both positive and negative)
    const [allStudentBalances] = await connection.query(`
      SELECT 
        s.id,
        s.name,
        se.id as enrollment_id,
        sab.current_balance,
        CASE 
          WHEN sab.current_balance < 0 THEN ABS(sab.current_balance)
          ELSE 0
        END as debtor_amount,
        CASE 
          WHEN sab.current_balance > 0 THEN sab.current_balance
          ELSE 0
        END as prepayment_amount
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
        AND sab.deleted_at IS NULL
      ORDER BY sab.current_balance
    `);

    const arBalanceValue = parseFloat(arBalance[0].balance || 0);
    const totalDebtors = parseFloat(debtorsTotal[0].total);
    const totalPrepayments = parseFloat(prepaymentsTotal[0].total);
    const netStudentBalance = totalDebtors - totalPrepayments;

    console.log('1️⃣ Accounts Receivable Analysis:');
    console.log(`   AR Balance (from journal entries): ${arBalanceValue.toFixed(2)}`);
    console.log(`   Student Debtors (negative balances): ${totalDebtors.toFixed(2)}`);
    console.log(`   Student Prepayments (positive balances): ${totalPrepayments.toFixed(2)}`);
    console.log(`   Net Student Balance (Debtors - Prepayments): ${netStudentBalance.toFixed(2)}`);
    console.log(`   Difference (AR - Net Student Balance): ${(arBalanceValue - netStudentBalance).toFixed(2)}\n`);

    console.log('2️⃣ The Issue:');
    console.log('   The Accounts Receivable account (10005) already includes ALL student balances (both debits and credits).');
    console.log('   But the balance sheet is:');
    console.log(`   - Adding student debtors to assets: +${totalDebtors.toFixed(2)}`);
    console.log(`   - Adding student prepayments to liabilities: +${totalPrepayments.toFixed(2)}`);
    console.log('   This DOUBLE COUNTS the student balances!\n');

    console.log('3️⃣ Solution:');
    console.log('   Option 1: Use AR balance only, exclude debtors/prepayments');
    console.log('   Option 2: Use debtors/prepayments only, exclude AR balance');
    console.log('   Option 3: Adjust AR by removing prepayments (since they are liabilities)\n');

    // Calculate what the balance should be
    const correctedAssets = 17712.38 - totalDebtors; // Remove double-counted debtors
    const correctedLiabilities = 2311.00 - totalPrepayments; // Remove double-counted prepayments
    const correctedLiabilitiesAndEquity = correctedLiabilities + 16849.38; // Equity stays same

    console.log('4️⃣ Corrected Calculation:');
    console.log(`   Assets (without double-counted debtors): ${correctedAssets.toFixed(2)}`);
    console.log(`   AR Balance (already includes debtors): ${arBalanceValue.toFixed(2)}`);
    console.log(`   Total Assets (AR only): ${correctedAssets.toFixed(2)}`);
    console.log(`   Liabilities (without double-counted prepayments): ${correctedLiabilities.toFixed(2)}`);
    console.log(`   Total Equity (with income): 16849.38`);
    console.log(`   Total Liabilities + Equity: ${correctedLiabilitiesAndEquity.toFixed(2)}`);
    console.log(`   Difference: ${(correctedAssets - correctedLiabilitiesAndEquity).toFixed(2)}\n`);

    // Better approach: AR should only show net debtors (debtors minus prepayments)
    // But prepayments should be shown as liabilities
    const arShouldBe = totalDebtors; // AR should only show what students owe
    const liabilitiesShouldBe = totalPrepayments; // Prepayments are liabilities

    console.log('5️⃣ Recommended Approach:');
    console.log(`   Accounts Receivable (net debtors only): ${arShouldBe.toFixed(2)}`);
    console.log(`   Student Prepayments (as liabilities): ${liabilitiesShouldBe.toFixed(2)}`);
    console.log(`   This means AR account (10005) needs adjustment: ${arBalanceValue.toFixed(2)} -> ${arShouldBe.toFixed(2)}`);
    console.log(`   Difference to fix: ${(arBalanceValue - arShouldBe).toFixed(2)}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

checkDiscrepancy();


