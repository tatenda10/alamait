require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function checkStudentOpeningBalanceJournals() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('CHECKING STUDENT OPENING BALANCE JOURNAL ENTRIES');
    console.log('='.repeat(80));
    console.log('');

    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    // 1. Find transactions that might be student opening balances
    // Look for transactions with descriptions containing "opening balance" or "student" and "balance"
    console.log('1️⃣  Finding student opening balance transactions...');
    const [openingBalanceTransactions] = await connection.query(
      `SELECT 
        t.id,
        t.transaction_type,
        t.transaction_date,
        t.description,
        t.reference,
        t.amount,
        t.status,
        t.boarding_house_id,
        bh.name as boarding_house_name
      FROM transactions t
      LEFT JOIN boarding_houses bh ON t.boarding_house_id = bh.id
      WHERE (t.description LIKE '%opening balance%' 
             OR t.description LIKE '%opening%balance%'
             OR t.description LIKE '%student%balance%'
             OR t.description LIKE '%initial balance%'
             OR t.reference LIKE '%OPENING%'
             OR t.reference LIKE '%OPEN%')
        AND t.deleted_at IS NULL
      ORDER BY t.transaction_date, t.id
      LIMIT 50`
    );

    console.log(`   Found ${openingBalanceTransactions.length} potential opening balance transactions\n`);

    if (openingBalanceTransactions.length === 0) {
      console.log('   ⚠️  No opening balance transactions found with those keywords.');
      console.log('   Trying alternative search...\n');
      
      // Alternative: Look for transactions with Accounts Receivable (10005) that might be opening balances
      const [arTransactions] = await connection.query(
        `SELECT DISTINCT
          t.id,
          t.transaction_type,
          t.transaction_date,
          t.description,
          t.reference,
          t.amount,
          t.status,
          t.boarding_house_id,
          bh.name as boarding_house_name
        FROM transactions t
        JOIN journal_entries je ON t.id = je.transaction_id
        JOIN chart_of_accounts coa ON je.account_id = coa.id
        LEFT JOIN boarding_houses bh ON t.boarding_house_id = bh.id
        WHERE coa.code = '10005'
          AND t.deleted_at IS NULL
          AND je.deleted_at IS NULL
          AND t.transaction_date < '2025-10-01'
        ORDER BY t.transaction_date, t.id
        LIMIT 50`
      );

      console.log(`   Found ${arTransactions.length} Accounts Receivable transactions before October 2025\n`);
      
      if (arTransactions.length > 0) {
        console.log('   Sample transactions:');
        arTransactions.slice(0, 10).forEach((tx, index) => {
          console.log(`   ${index + 1}. Txn ${tx.id} | ${tx.transaction_date} | ${tx.description || tx.reference || 'N/A'} | $${parseFloat(tx.amount || 0).toFixed(2)}`);
        });
        console.log('');
      }
    } else {
      console.log('   Opening balance transactions found:');
      openingBalanceTransactions.slice(0, 20).forEach((tx, index) => {
        console.log(`   ${index + 1}. Txn ${tx.id} | ${tx.transaction_date} | ${tx.description || tx.reference || 'N/A'} | $${parseFloat(tx.amount || 0).toFixed(2)} | ${tx.boarding_house_name || 'N/A'}`);
      });
      console.log('');
    }

    // 2. Get journal entries for these transactions
    console.log('2️⃣  Analyzing journal entries for opening balance transactions...\n');
    
    const transactionsToCheck = openingBalanceTransactions.length > 0 
      ? openingBalanceTransactions 
      : await connection.query(
          `SELECT DISTINCT t.id
           FROM transactions t
           JOIN journal_entries je ON t.id = je.transaction_id
           JOIN chart_of_accounts coa ON je.account_id = coa.id
           WHERE coa.code = '10005'
             AND t.deleted_at IS NULL
             AND je.deleted_at IS NULL
             AND t.transaction_date < '2025-10-01'
           ORDER BY t.transaction_date
           LIMIT 20`
        ).then(([rows]) => rows.map(r => ({ id: r.id })));

    if (transactionsToCheck.length === 0) {
      console.log('   ⚠️  No transactions to analyze.');
      return;
    }

    const transactionIds = transactionsToCheck.map(t => t.id);
    
    const [journalEntries] = await connection.query(
      `SELECT 
        t.id as transaction_id,
        t.transaction_date,
        t.description as transaction_description,
        t.reference,
        t.amount as transaction_amount,
        je.id as journal_entry_id,
        je.entry_type,
        je.amount as journal_amount,
        je.description as journal_description,
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        bh.name as boarding_house_name
      FROM transactions t
      JOIN journal_entries je ON t.id = je.transaction_id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      LEFT JOIN boarding_houses bh ON t.boarding_house_id = bh.id
      WHERE t.id IN (?)
        AND t.deleted_at IS NULL
        AND je.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      ORDER BY t.transaction_date, t.id, je.entry_type`,
      [transactionIds]
    );

    console.log(`   Found ${journalEntries.length} journal entries for ${transactionIds.length} transactions\n`);

    // 3. Group by transaction and show the pattern
    const transactionsMap = {};
    journalEntries.forEach(je => {
      if (!transactionsMap[je.transaction_id]) {
        transactionsMap[je.transaction_id] = {
          transaction_id: je.transaction_id,
          transaction_date: je.transaction_date,
          transaction_description: je.transaction_description,
          reference: je.reference,
          transaction_amount: je.transaction_amount,
          boarding_house: je.boarding_house_name,
          debit_entries: [],
          credit_entries: []
        };
      }
      
      if (je.entry_type === 'debit') {
        transactionsMap[je.transaction_id].debit_entries.push({
          account_code: je.account_code,
          account_name: je.account_name,
          account_type: je.account_type,
          amount: je.journal_amount
        });
      } else {
        transactionsMap[je.transaction_id].credit_entries.push({
          account_code: je.account_code,
          account_name: je.account_name,
          account_type: je.account_type,
          amount: je.journal_amount
        });
      }
    });

    console.log('3️⃣  Journal Entry Patterns for Opening Balances:\n');
    console.log('='.repeat(80));
    
    Object.values(transactionsMap).slice(0, 10).forEach((tx, index) => {
      console.log(`\nTransaction ${tx.transaction_id} | ${tx.transaction_date} | ${tx.boarding_house || 'N/A'}`);
      console.log(`  Description: ${tx.transaction_description || tx.reference || 'N/A'}`);
      console.log(`  Amount: $${parseFloat(tx.transaction_amount || 0).toFixed(2)}`);
      console.log(`  DEBIT ENTRIES:`);
      tx.debit_entries.forEach(de => {
        console.log(`    - ${de.account_code} (${de.account_name}) [${de.account_type}] : $${parseFloat(de.amount).toFixed(2)}`);
      });
      console.log(`  CREDIT ENTRIES:`);
      tx.credit_entries.forEach(ce => {
        console.log(`    - ${ce.account_code} (${ce.account_name}) [${ce.account_type}] : $${parseFloat(ce.amount).toFixed(2)}`);
      });
    });

    // 4. Summary of account patterns
    console.log('\n' + '='.repeat(80));
    console.log('4️⃣  SUMMARY OF ACCOUNT PATTERNS:\n');
    
    const debitAccounts = {};
    const creditAccounts = {};
    
    journalEntries.forEach(je => {
      const accountKey = `${je.account_code} - ${je.account_name}`;
      if (je.entry_type === 'debit') {
        if (!debitAccounts[accountKey]) {
          debitAccounts[accountKey] = { code: je.account_code, name: je.account_name, type: je.account_type, count: 0, total: 0 };
        }
        debitAccounts[accountKey].count++;
        debitAccounts[accountKey].total += parseFloat(je.journal_amount);
      } else {
        if (!creditAccounts[accountKey]) {
          creditAccounts[accountKey] = { code: je.account_code, name: je.account_name, type: je.account_type, count: 0, total: 0 };
        }
        creditAccounts[accountKey].count++;
        creditAccounts[accountKey].total += parseFloat(je.journal_amount);
      }
    });

    console.log('DEBIT Accounts Used:');
    Object.values(debitAccounts).sort((a, b) => b.count - a.count).forEach(acc => {
      console.log(`  ${acc.code} (${acc.name}) [${acc.type}]`);
      console.log(`    Used in ${acc.count} entries | Total: $${acc.total.toFixed(2)}`);
    });

    console.log('\nCREDIT Accounts Used:');
    Object.values(creditAccounts).sort((a, b) => b.count - a.count).forEach(acc => {
      console.log(`  ${acc.code} (${acc.name}) [${acc.type}]`);
      console.log(`    Used in ${acc.count} entries | Total: $${acc.total.toFixed(2)}`);
    });

    // 5. Most common pattern
    console.log('\n' + '='.repeat(80));
    console.log('5️⃣  MOST COMMON PATTERN:\n');
    
    const patterns = {};
    Object.values(transactionsMap).forEach(tx => {
      const debitCodes = tx.debit_entries.map(e => e.account_code).sort().join(', ');
      const creditCodes = tx.credit_entries.map(e => e.account_code).sort().join(', ');
      const pattern = `DEBIT: [${debitCodes}] | CREDIT: [${creditCodes}]`;
      
      if (!patterns[pattern]) {
        patterns[pattern] = { count: 0, transactions: [] };
      }
      patterns[pattern].count++;
      patterns[pattern].transactions.push(tx.transaction_id);
    });

    const sortedPatterns = Object.entries(patterns).sort((a, b) => b[1].count - a[1].count);
    
    console.log('Pattern frequency:');
    sortedPatterns.slice(0, 5).forEach(([pattern, data], index) => {
      console.log(`\n${index + 1}. ${pattern}`);
      console.log(`   Used in ${data.count} transactions`);
      console.log(`   Transaction IDs: ${data.transactions.slice(0, 10).join(', ')}${data.transactions.length > 10 ? '...' : ''}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ Analysis complete!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error in checkStudentOpeningBalanceJournals:', error);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
    console.log('\n🔌 Database connection closed.\n');
  }
}

checkStudentOpeningBalanceJournals();

