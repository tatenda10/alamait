require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function analyzeStudentARBreakdown() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('ACCOUNTS RECEIVABLE BREAKDOWN - STUDENT DEBTS vs PREPAYMENTS');
    console.log('='.repeat(80));
    console.log('');

    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    // Get current AR balance from journal entries
    console.log('1️⃣  CURRENT ACCOUNTS RECEIVABLE (10005) BALANCE:\n');
    
    const [arBalance] = await connection.query(`
      SELECT 
        coa.code as account_code,
        coa.name as account_name,
        COALESCE(
          SUM(
            CASE 
              WHEN je.entry_type = 'debit' THEN je.amount
              WHEN je.entry_type = 'credit' THEN -je.amount
              ELSE 0
            END
          ), 0
        ) as current_balance,
        COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0) as total_debits,
        COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0) as total_credits
      FROM chart_of_accounts coa
      LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
      LEFT JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL AND t.status = 'posted'
      WHERE coa.code = '10005'
        AND coa.deleted_at IS NULL
      GROUP BY coa.id, coa.code, coa.name
    `);

    if (arBalance.length > 0) {
      const ar = arBalance[0];
      console.log(`   Account: ${ar.account_code} - ${ar.account_name}`);
      console.log(`   Current Balance: $${parseFloat(ar.current_balance).toFixed(2)}`);
      console.log(`   Total Debits: $${parseFloat(ar.total_debits).toFixed(2)}`);
      console.log(`   Total Credits: $${parseFloat(ar.total_credits).toFixed(2)}`);
      console.log('');
    }

    // Get student account balances breakdown
    console.log('2️⃣  STUDENT ACCOUNT BALANCES BREAKDOWN:\n');
    
    const [studentBalances] = await connection.query(`
      SELECT 
        s.id as student_id,
        s.full_name,
        s.student_id as student_number,
        se.id as enrollment_id,
        se.checkout_date,
        sab.current_balance,
        CASE 
          WHEN sab.current_balance < 0 THEN 'DEBTOR'
          WHEN sab.current_balance > 0 THEN 'PREPAYMENT'
          ELSE 'ZERO'
        END as balance_type,
        ABS(sab.current_balance) as balance_amount
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
        AND sab.current_balance != 0
      ORDER BY sab.current_balance ASC
    `);

    let totalDebtors = 0;
    let totalPrepayments = 0;
    const debtors = [];
    const prepayments = [];

    studentBalances.forEach(sb => {
      const balance = parseFloat(sb.current_balance);
      if (balance < 0) {
        // Student owes money (debtor)
        totalDebtors += Math.abs(balance);
        debtors.push({
          student: `${sb.full_name || 'Unknown'} (${sb.student_number || 'N/A'})`,
          enrollment_id: sb.enrollment_id,
          checkout_date: sb.checkout_date,
          debt: Math.abs(balance)
        });
      } else if (balance > 0) {
        // Student has overpaid (prepayment)
        totalPrepayments += balance;
        prepayments.push({
          student: `${sb.full_name || 'Unknown'} (${sb.student_number || 'N/A'})`,
          enrollment_id: sb.enrollment_id,
          checkout_date: sb.checkout_date,
          prepayment: balance
        });
      }
    });

    console.log('   STUDENT DEBTORS (Should be in ASSETS - Accounts Receivable):\n');
    if (debtors.length > 0) {
      console.log(`${'Student Name'.padEnd(40)} ${'Enrollment ID'.padStart(15)} ${'Debt Amount'.padStart(20)}`);
      console.log('-'.repeat(75));
      debtors.forEach(d => {
        const status = d.checkout_date ? '(Checked Out)' : '(Active)';
        console.log(`${d.student.padEnd(40)} ${d.enrollment_id.toString().padStart(15)} $${d.debt.toFixed(2).padStart(19)} ${status}`);
      });
      console.log('-'.repeat(75));
      console.log(`${'TOTAL DEBTORS'.padEnd(56)} $${totalDebtors.toFixed(2).padStart(19)}`);
    } else {
      console.log('   No student debtors found.');
    }
    console.log('');

    console.log('   STUDENT PREPAYMENTS (Should be in LIABILITIES - Student Prepayments):\n');
    if (prepayments.length > 0) {
      console.log(`${'Student Name'.padEnd(40)} ${'Enrollment ID'.padStart(15)} ${'Prepayment Amount'.padStart(20)}`);
      console.log('-'.repeat(75));
      prepayments.forEach(p => {
        const status = p.checkout_date ? '(Checked Out)' : '(Active)';
        console.log(`${p.student.padEnd(40)} ${p.enrollment_id.toString().padStart(15)} $${p.prepayment.toFixed(2).padStart(19)} ${status}`);
      });
      console.log('-'.repeat(75));
      console.log(`${'TOTAL PREPAYMENTS'.padEnd(56)} $${totalPrepayments.toFixed(2).padStart(19)}`);
    } else {
      console.log('   No student prepayments found.');
    }
    console.log('');

    // Summary
    console.log('3️⃣  SUMMARY:\n');
    console.log(`   Current AR Balance (from journal entries): $${parseFloat(arBalance[0].current_balance).toFixed(2)}`);
    console.log(`   Total Student Debtors: $${totalDebtors.toFixed(2)}`);
    console.log(`   Total Student Prepayments: $${totalPrepayments.toFixed(2)}`);
    console.log(`   Net: $${totalDebtors.toFixed(2)} - $${totalPrepayments.toFixed(2)} = $${(totalDebtors - totalPrepayments).toFixed(2)}`);
    console.log('');

    // Balance Sheet Impact
    console.log('4️⃣  BALANCE SHEET IMPACT:\n');
    console.log('   CURRENT (Incorrect):');
    console.log(`     Assets - Accounts Receivable: $${parseFloat(arBalance[0].current_balance).toFixed(2)} (NEGATIVE - wrong!)`);
    console.log(`     Liabilities - Student Prepayments: $0.00 (MISSING!)`);
    console.log('');

    console.log('   CORRECTED (Should be):');
    console.log(`     Assets - Accounts Receivable: $${totalDebtors.toFixed(2)} (Student debtors only)`);
    console.log(`     Liabilities - Student Prepayments: $${totalPrepayments.toFixed(2)} (Student prepayments)`);
    console.log('');

    // Calculate corrected total assets
    const currentTotalAssets = 4116.38; // From previous calculation
    const currentARBalance = parseFloat(arBalance[0].current_balance);
    const correctedARBalance = totalDebtors;
    const adjustmentToAssets = correctedARBalance - currentARBalance;
    const correctedTotalAssets = currentTotalAssets + adjustmentToAssets;

    console.log('5️⃣  CORRECTED TOTAL ASSETS CALCULATION:\n');
    console.log(`   Current Total Assets: $${currentTotalAssets.toFixed(2)}`);
    console.log(`   Current AR Balance: $${currentARBalance.toFixed(2)}`);
    console.log(`   Corrected AR Balance: $${correctedARBalance.toFixed(2)}`);
    console.log(`   Adjustment: $${adjustmentToAssets.toFixed(2)}`);
    console.log(`   Corrected Total Assets: $${correctedTotalAssets.toFixed(2)}`);
    console.log('');

    // New liabilities
    console.log('6️⃣  NEW LIABILITIES:\n');
    console.log(`   Student Prepayments: $${totalPrepayments.toFixed(2)}`);
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ Analysis Complete!');
    console.log('='.repeat(80));
    console.log('');
    console.log('RECOMMENDATION:');
    console.log('   - Accounts Receivable (10005) should only show student DEBTORS: $' + totalDebtors.toFixed(2));
    console.log('   - Create a new liability account "Student Prepayments" for: $' + totalPrepayments.toFixed(2));
    console.log('   - This will correctly separate assets (money owed to us) from liabilities (money we owe to students)');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
    console.log('🔌 Database connection closed.\n');
  }
}

analyzeStudentARBreakdown();

