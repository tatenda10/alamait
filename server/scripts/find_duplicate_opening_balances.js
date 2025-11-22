require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function findDuplicateOpeningBalances() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('FINDING DUPLICATE STUDENT OPENING BALANCE ENTRIES');
    console.log('='.repeat(80));
    console.log('');

    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    // Find all student opening balance transactions
    console.log('1️⃣  Finding all student opening balance transactions...\n');
    
    const [allOpeningBalances] = await connection.query(`
      SELECT 
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
        CASE 
          WHEN coa_debit.code = '10005' THEN 'debit_balance'
          WHEN coa_credit.code = '10005' THEN 'credit_balance'
        END as balance_type
      FROM transactions t
      JOIN journal_entries je_debit ON t.id = je_debit.transaction_id AND je_debit.entry_type = 'debit'
      JOIN journal_entries je_credit ON t.id = je_credit.transaction_id AND je_credit.entry_type = 'credit'
      JOIN chart_of_accounts coa_debit ON je_debit.account_id = coa_debit.id
      JOIN chart_of_accounts coa_credit ON je_credit.account_id = coa_credit.id
      LEFT JOIN boarding_houses bh ON t.boarding_house_id = bh.id
      WHERE (
          (coa_debit.code = '10005' AND coa_credit.code = '40001')  -- Debit balance (student owes)
          OR (coa_debit.code = '40001' AND coa_credit.code = '10005')  -- Credit balance (student overpaid)
        )
        AND t.deleted_at IS NULL
        AND je_debit.deleted_at IS NULL
        AND je_credit.deleted_at IS NULL
        AND (t.description LIKE '%previous balance%' 
             OR t.description LIKE '%opening balance%'
             OR t.description LIKE '%initial balance%'
             OR t.reference LIKE '%PREV%'
             OR t.reference LIKE '%OPEN%')
      ORDER BY t.transaction_date, t.description, t.id
    `);

    console.log(`   Found ${allOpeningBalances.length} total opening balance transactions\n`);

    // Extract student name from description
    const extractStudentName = (description) => {
      const match = description.match(/- ([^-]+) \((debit|credit)\)/i);
      return match ? match[1].trim() : null;
    };

    // Group by student name, amount, date, and balance type to find duplicates
    const grouped = {};
    
    allOpeningBalances.forEach(tx => {
      const studentName = extractStudentName(tx.description);
      if (!studentName) return;

      const key = `${studentName}|${tx.amount || tx.debit_amount || tx.credit_amount}|${tx.transaction_date.split(' ')[0]}|${tx.balance_type}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(tx);
    });

    // Find duplicates (groups with more than 1 transaction)
    const duplicates = Object.entries(grouped).filter(([key, transactions]) => transactions.length > 1);

    console.log('2️⃣  DUPLICATE ENTRIES FOUND:\n');
    
    if (duplicates.length === 0) {
      console.log('   ✅ No duplicate entries found!\n');
    } else {
      console.log(`   Found ${duplicates.length} sets of duplicate entries:\n`);
      
      duplicates.forEach(([key, transactions], index) => {
        const [studentName, amount, date, balanceType] = key.split('|');
        console.log(`   ${index + 1}. ${studentName} - ${balanceType === 'debit_balance' ? 'Debit Balance' : 'Credit Balance'}`);
        console.log(`      Amount: $${parseFloat(amount).toFixed(2)} | Date: ${date}`);
        console.log(`      Found ${transactions.length} duplicate transactions:\n`);
        
        transactions.forEach((tx, txIndex) => {
          console.log(`      Transaction ${txIndex + 1}:`);
          console.log(`        Transaction ID: ${tx.transaction_id}`);
          console.log(`        Reference: ${tx.reference || 'N/A'}`);
          console.log(`        Description: ${tx.description || 'N/A'}`);
          console.log(`        Date: ${tx.transaction_date}`);
          console.log(`        Boarding House: ${tx.boarding_house_name || 'N/A'}`);
          console.log(`        Debit: ${tx.debit_account_code} (${tx.debit_account_name}) - $${parseFloat(tx.debit_amount || 0).toFixed(2)}`);
          console.log(`        Credit: ${tx.credit_account_code} (${tx.credit_account_name}) - $${parseFloat(tx.credit_amount || 0).toFixed(2)}`);
          console.log('');
        });
        
        console.log('      ⚠️  RECOMMENDATION: Keep one transaction and delete the others');
        console.log('      Suggested to keep: Transaction ID ' + transactions[0].transaction_id + ' (first occurrence)');
        console.log('      Suggested to delete: Transaction IDs ' + transactions.slice(1).map(t => t.transaction_id).join(', '));
        console.log('');
        console.log('='.repeat(80));
        console.log('');
      });

      // Summary
      const totalDuplicateTransactions = duplicates.reduce((sum, [key, transactions]) => sum + transactions.length, 0);
      const totalToDelete = totalDuplicateTransactions - duplicates.length; // Keep one from each group
      
      console.log('3️⃣  SUMMARY:\n');
      console.log(`   Total duplicate sets: ${duplicates.length}`);
      console.log(`   Total duplicate transactions: ${totalDuplicateTransactions}`);
      console.log(`   Transactions to keep: ${duplicates.length} (one from each set)`);
      console.log(`   Transactions to delete: ${totalToDelete}`);
      console.log('');
      console.log('   Duplicate Transaction IDs to delete:');
      const idsToDelete = [];
      duplicates.forEach(([key, transactions]) => {
        transactions.slice(1).forEach(tx => idsToDelete.push(tx.transaction_id));
      });
      console.log(`   ${idsToDelete.join(', ')}`);
      console.log('');
    }

    // Also check for exact duplicate references
    console.log('4️⃣  CHECKING FOR EXACT DUPLICATE REFERENCES:\n');
    const referenceGroups = {};
    
    allOpeningBalances.forEach(tx => {
      if (tx.reference) {
        if (!referenceGroups[tx.reference]) {
          referenceGroups[tx.reference] = [];
        }
        referenceGroups[tx.reference].push(tx);
      }
    });

    const duplicateReferences = Object.entries(referenceGroups).filter(([ref, transactions]) => transactions.length > 1);
    
    if (duplicateReferences.length === 0) {
      console.log('   ✅ No duplicate references found\n');
    } else {
      console.log(`   ⚠️  Found ${duplicateReferences.length} references used multiple times:\n`);
      duplicateReferences.forEach(([ref, transactions]) => {
        console.log(`   Reference: ${ref}`);
        console.log(`   Used in ${transactions.length} transactions: ${transactions.map(t => t.transaction_id).join(', ')}`);
        console.log('');
      });
    }

    console.log('='.repeat(80));
    console.log('✅ Analysis Complete!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error in findDuplicateOpeningBalances:', error);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
    console.log('\n🔌 Database connection closed.\n');
  }
}

findDuplicateOpeningBalances();

