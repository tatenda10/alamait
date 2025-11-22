require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function analyzeStudentOpeningBalanceCorrections() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('ANALYZING STUDENT OPENING BALANCE JOURNAL ENTRIES FOR CORRECTIONS');
    console.log('='.repeat(80));
    console.log('');

    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    // Find student opening balance transactions
    // 1. Debit balance (students owe) - Accounts Receivable debited, Revenue credited (WRONG)
    console.log('1️⃣  Finding student opening balance transactions (debit balances - students owe)...');
    const [debitBalanceTransactions] = await connection.query(
      `SELECT 
        t.id as transaction_id,
        t.transaction_date,
        t.description,
        t.reference,
        t.amount,
        t.boarding_house_id,
        bh.name as boarding_house_name,
        je_debit.amount as debit_amount,
        je_credit.amount as credit_amount,
        coa_debit.code as debit_account_code,
        coa_debit.name as debit_account_name,
        coa_credit.code as credit_account_code,
        coa_credit.name as credit_account_name,
        'debit' as balance_type
      FROM transactions t
      JOIN journal_entries je_debit ON t.id = je_debit.transaction_id AND je_debit.entry_type = 'debit'
      JOIN journal_entries je_credit ON t.id = je_credit.transaction_id AND je_credit.entry_type = 'credit'
      JOIN chart_of_accounts coa_debit ON je_debit.account_id = coa_debit.id
      JOIN chart_of_accounts coa_credit ON je_credit.account_id = coa_credit.id
      LEFT JOIN boarding_houses bh ON t.boarding_house_id = bh.id
      WHERE coa_debit.code = '10005'  -- Accounts Receivable
        AND coa_credit.code = '40001'  -- Revenue (this is the WRONG account)
        AND t.deleted_at IS NULL
        AND je_debit.deleted_at IS NULL
        AND je_credit.deleted_at IS NULL
        AND (t.description LIKE '%previous balance%' 
             OR t.description LIKE '%opening balance%'
             OR t.description LIKE '%initial balance%'
             OR t.reference LIKE '%PREV%'
             OR t.reference LIKE '%OPEN%')
      ORDER BY t.transaction_date, t.id`
    );

    // 2. Credit balance (students overpaid) - Revenue debited, Accounts Receivable credited (WRONG)
    console.log('   Finding student opening balance transactions (credit balances - students overpaid)...');
    const [creditBalanceTransactions] = await connection.query(
      `SELECT 
        t.id as transaction_id,
        t.transaction_date,
        t.description,
        t.reference,
        t.amount,
        t.boarding_house_id,
        bh.name as boarding_house_name,
        je_debit.amount as debit_amount,
        je_credit.amount as credit_amount,
        coa_debit.code as debit_account_code,
        coa_debit.name as debit_account_name,
        coa_credit.code as credit_account_code,
        coa_credit.name as credit_account_name,
        'credit' as balance_type
      FROM transactions t
      JOIN journal_entries je_debit ON t.id = je_debit.transaction_id AND je_debit.entry_type = 'debit'
      JOIN journal_entries je_credit ON t.id = je_credit.transaction_id AND je_credit.entry_type = 'credit'
      JOIN chart_of_accounts coa_debit ON je_debit.account_id = coa_debit.id
      JOIN chart_of_accounts coa_credit ON je_credit.account_id = coa_credit.id
      LEFT JOIN boarding_houses bh ON t.boarding_house_id = bh.id
      WHERE coa_debit.code = '40001'  -- Revenue (this is the WRONG account)
        AND coa_credit.code = '10005'  -- Accounts Receivable
        AND t.deleted_at IS NULL
        AND je_debit.deleted_at IS NULL
        AND je_credit.deleted_at IS NULL
        AND (t.description LIKE '%previous balance%' 
             OR t.description LIKE '%opening balance%'
             OR t.description LIKE '%initial balance%'
             OR t.reference LIKE '%PREV%'
             OR t.reference LIKE '%OPEN%')
      ORDER BY t.transaction_date, t.id`
    );

    const openingBalanceTransactions = [...debitBalanceTransactions, ...creditBalanceTransactions];

    console.log(`   Found ${debitBalanceTransactions.length} debit balance transactions (students owe)`);
    console.log(`   Found ${creditBalanceTransactions.length} credit balance transactions (students overpaid)`);
    console.log(`   Total: ${openingBalanceTransactions.length} student opening balance transactions with incorrect journal entries\n`);

    if (openingBalanceTransactions.length === 0) {
      console.log('   ✅ No incorrect student opening balance transactions found.');
      console.log('   All student opening balances may already be correct.\n');
      return;
    }

    // Display the incorrect transactions
    console.log('2️⃣  Incorrect Student Opening Balance Transactions:\n');
    
    let totalDebitAmount = 0;
    let totalCreditAmount = 0;
    
    if (debitBalanceTransactions.length > 0) {
      console.log('   DEBIT BALANCES (Students Owe Money):\n');
      debitBalanceTransactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. Transaction ${tx.transaction_id} | ${tx.transaction_date}`);
        console.log(`      Description: ${tx.description || tx.reference || 'N/A'}`);
        console.log(`      Boarding House: ${tx.boarding_house_name || 'N/A'}`);
        console.log(`      Amount: $${parseFloat(tx.amount || tx.debit_amount || 0).toFixed(2)}`);
        console.log(`      ❌ INCORRECT: Debit ${tx.debit_account_code} (${tx.debit_account_name}) | Credit ${tx.credit_account_code} (${tx.credit_account_name})`);
        console.log('');
        totalDebitAmount += parseFloat(tx.amount || tx.debit_amount || 0);
      });
      console.log(`   Total Debit Balance Amount: $${totalDebitAmount.toFixed(2)}\n`);
    }

    if (creditBalanceTransactions.length > 0) {
      console.log('   CREDIT BALANCES (Students Overpaid/Have Credit):\n');
      creditBalanceTransactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. Transaction ${tx.transaction_id} | ${tx.transaction_date}`);
        console.log(`      Description: ${tx.description || tx.reference || 'N/A'}`);
        console.log(`      Boarding House: ${tx.boarding_house_name || 'N/A'}`);
        console.log(`      Amount: $${parseFloat(tx.amount || tx.credit_amount || 0).toFixed(2)}`);
        console.log(`      ❌ INCORRECT: Debit ${tx.debit_account_code} (${tx.debit_account_name}) | Credit ${tx.credit_account_code} (${tx.credit_account_name})`);
        console.log('');
        totalCreditAmount += parseFloat(tx.amount || tx.credit_amount || 0);
      });
      console.log(`   Total Credit Balance Amount: $${totalCreditAmount.toFixed(2)}\n`);
    }

    // Get Opening Balance Equity account
    const [openingBalanceEquity] = await connection.query(
      `SELECT id, code, name FROM chart_of_accounts 
       WHERE code = '30004' AND type = 'Equity' AND deleted_at IS NULL
       LIMIT 1`
    );

    if (openingBalanceEquity.length === 0) {
      console.log('   ⚠️  Opening Balance Equity account (30004) not found. Cannot proceed with correction analysis.');
      return;
    }

    const equityAccount = openingBalanceEquity[0];
    console.log(`   ✅ Opening Balance Equity account found: ${equityAccount.code} (${equityAccount.name})\n`);

    // Explain the correction
    console.log('3️⃣  CORRECTION REQUIRED:\n');
    
    if (debitBalanceTransactions.length > 0) {
      console.log('   DEBIT BALANCES (Students Owe):');
      console.log('   Current (INCORRECT) Entry:');
      console.log('     Debit:  Accounts Receivable (10005)');
      console.log('     Credit: Revenue (40001) ❌');
      console.log('');
      console.log('   Should be (CORRECT) Entry:');
      console.log('     Debit:  Accounts Receivable (10005)');
      console.log('     Credit: Opening Balance Equity (30004) ✅');
      console.log('');
    }

    if (creditBalanceTransactions.length > 0) {
      console.log('   CREDIT BALANCES (Students Overpaid):');
      console.log('   Current (INCORRECT) Entry:');
      console.log('     Debit:  Revenue (40001) ❌');
      console.log('     Credit: Accounts Receivable (10005)');
      console.log('');
      console.log('   Should be (CORRECT) Entry:');
      console.log('     Debit:  Opening Balance Equity (30004) ✅');
      console.log('     Credit: Accounts Receivable (10005)');
      console.log('');
    }

    // Show the correcting journal entries
    console.log('4️⃣  CORRECTING JOURNAL ENTRIES TO CREATE:\n');
    
    if (debitBalanceTransactions.length > 0) {
      console.log('   For DEBIT BALANCES (students owe):');
      console.log('   Adjusting Entry:');
      console.log(`     Debit:  Revenue (40001) - $${totalDebitAmount.toFixed(2)}`);
      console.log(`     Credit: Opening Balance Equity (30004) - $${totalDebitAmount.toFixed(2)}`);
      console.log('');
      console.log('   This will:');
      console.log('     - Remove the incorrect credit from Revenue (reduces revenue)');
      console.log('     - Add the correct credit to Opening Balance Equity (proper opening balance)');
      console.log('     - Keep Accounts Receivable unchanged (already correct)');
      console.log('');
    }

    if (creditBalanceTransactions.length > 0) {
      console.log('   For CREDIT BALANCES (students overpaid):');
      console.log('   Adjusting Entry:');
      console.log(`     Debit:  Opening Balance Equity (30004) - $${totalCreditAmount.toFixed(2)}`);
      console.log(`     Credit: Revenue (40001) - $${totalCreditAmount.toFixed(2)}`);
      console.log('');
      console.log('   This will:');
      console.log('     - Remove the incorrect debit from Revenue (reduces revenue)');
      console.log('     - Add the correct debit to Opening Balance Equity (proper opening balance)');
      console.log('     - Keep Accounts Receivable unchanged (already correct)');
      console.log('');
    }

    // Group by boarding house for easier correction
    console.log('5️⃣  BREAKDOWN BY BOARDING HOUSE:\n');
    const byBoardingHouse = {
      debit: {},
      credit: {}
    };
    
    debitBalanceTransactions.forEach(tx => {
      const bhName = tx.boarding_house_name || 'Unknown';
      if (!byBoardingHouse.debit[bhName]) {
        byBoardingHouse.debit[bhName] = {
          transactions: [],
          total: 0
        };
      }
      byBoardingHouse.debit[bhName].transactions.push(tx);
      byBoardingHouse.debit[bhName].total += parseFloat(tx.amount || tx.debit_amount || 0);
    });

    creditBalanceTransactions.forEach(tx => {
      const bhName = tx.boarding_house_name || 'Unknown';
      if (!byBoardingHouse.credit[bhName]) {
        byBoardingHouse.credit[bhName] = {
          transactions: [],
          total: 0
        };
      }
      byBoardingHouse.credit[bhName].transactions.push(tx);
      byBoardingHouse.credit[bhName].total += parseFloat(tx.amount || tx.credit_amount || 0);
    });

    if (Object.keys(byBoardingHouse.debit).length > 0) {
      console.log('   DEBIT BALANCES by Boarding House:');
      Object.entries(byBoardingHouse.debit).forEach(([bhName, data]) => {
        console.log(`     ${bhName}:`);
        console.log(`       Transactions: ${data.transactions.length}`);
        console.log(`       Total Amount: $${data.total.toFixed(2)}`);
        console.log(`       Adjusting Entry Needed:`);
        console.log(`         Debit:  Revenue (40001) - $${data.total.toFixed(2)}`);
        console.log(`         Credit: Opening Balance Equity (30004) - $${data.total.toFixed(2)}`);
        console.log('');
      });
    }

    if (Object.keys(byBoardingHouse.credit).length > 0) {
      console.log('   CREDIT BALANCES by Boarding House:');
      Object.entries(byBoardingHouse.credit).forEach(([bhName, data]) => {
        console.log(`     ${bhName}:`);
        console.log(`       Transactions: ${data.transactions.length}`);
        console.log(`       Total Amount: $${data.total.toFixed(2)}`);
        console.log(`       Adjusting Entry Needed:`);
        console.log(`         Debit:  Opening Balance Equity (30004) - $${data.total.toFixed(2)}`);
        console.log(`         Credit: Revenue (40001) - $${data.total.toFixed(2)}`);
        console.log('');
      });
    }

    // Summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Incorrect Transactions: ${openingBalanceTransactions.length}`);
    console.log(`  - Debit Balances (students owe): ${debitBalanceTransactions.length} transactions - $${totalDebitAmount.toFixed(2)}`);
    console.log(`  - Credit Balances (students overpaid): ${creditBalanceTransactions.length} transactions - $${totalCreditAmount.toFixed(2)}`);
    console.log('');
    
    if (debitBalanceTransactions.length > 0) {
      console.log('CORRECTING ENTRY FOR DEBIT BALANCES:');
      console.log(`  Debit:  Revenue (40001) - $${totalDebitAmount.toFixed(2)}`);
      console.log(`  Credit: Opening Balance Equity (30004) - $${totalDebitAmount.toFixed(2)}`);
      console.log('');
    }
    
    if (creditBalanceTransactions.length > 0) {
      console.log('CORRECTING ENTRY FOR CREDIT BALANCES:');
      console.log(`  Debit:  Opening Balance Equity (30004) - $${totalCreditAmount.toFixed(2)}`);
      console.log(`  Credit: Revenue (40001) - $${totalCreditAmount.toFixed(2)}`);
      console.log('');
    }
    
    if (debitBalanceTransactions.length > 0 && creditBalanceTransactions.length > 0) {
      const netAmount = totalDebitAmount - totalCreditAmount;
      console.log('NET CORRECTING ENTRY (if combining both):');
      if (netAmount > 0) {
        console.log(`  Debit:  Revenue (40001) - $${netAmount.toFixed(2)}`);
        console.log(`  Credit: Opening Balance Equity (30004) - $${netAmount.toFixed(2)}`);
      } else if (netAmount < 0) {
        console.log(`  Debit:  Opening Balance Equity (30004) - $${Math.abs(netAmount).toFixed(2)}`);
        console.log(`  Credit: Revenue (40001) - $${Math.abs(netAmount).toFixed(2)}`);
      } else {
        console.log('  No net correction needed (amounts cancel out)');
      }
      console.log('');
    }
    
    console.log('OR Create Separate Entries by Boarding House (see breakdown above)');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error in analyzeStudentOpeningBalanceCorrections:', error);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
    console.log('\n🔌 Database connection closed.\n');
  }
}

analyzeStudentOpeningBalanceCorrections();

