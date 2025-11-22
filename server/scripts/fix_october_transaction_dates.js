require('dotenv').config();
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true // Return dates as strings to prevent timezone conversion
};

async function fixOctoberTransactionDates() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('FIXING OCTOBER TRANSACTION DATES');
    console.log('='.repeat(80));
    console.log('');

    // Connect to database
    console.log('📊 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    // Start transaction
    await connection.beginTransaction();

    // 1. Find student invoices with invoice_date = 2025-10-01
    console.log('1️⃣  Finding student invoices with invoice_date = 2025-10-01...');
    const [invoices] = await connection.query(`
      SELECT 
        si.id as invoice_id,
        si.invoice_date,
        si.amount,
        si.description,
        si.reference_number,
        se.boarding_house_id
      FROM student_invoices si
      JOIN student_enrollments se ON si.enrollment_id = se.id
      WHERE DATE(si.invoice_date) = '2025-10-01'
        AND si.deleted_at IS NULL
        AND se.deleted_at IS NULL
      ORDER BY si.id
    `);

    console.log(`   Found ${invoices.length} invoices with invoice_date = 2025-10-01`);
    console.log('');

    if (invoices.length === 0) {
      console.log('   ✅ No invoices found. Nothing to fix.');
      await connection.rollback();
      return;
    }

    // 2. Find transactions linked to these invoices
    // Transactions are linked by reference number or description matching
    console.log('2️⃣  Finding transactions linked to these invoices...');
    
    // First, try to find transactions that match by reference or description
    let transactionQuery = `
      SELECT DISTINCT
        t.id as transaction_id,
        t.transaction_date,
        t.reference,
        t.description,
        t.transaction_type,
        si.id as invoice_id,
        si.invoice_date,
        si.reference_number as invoice_ref,
        si.description as invoice_description
      FROM transactions t
      JOIN student_invoices si ON (
        (t.reference = si.reference_number AND si.reference_number IS NOT NULL)
        OR t.description LIKE CONCAT('%', si.reference_number, '%')
        OR t.description LIKE CONCAT('%Invoice - ', si.id, '%')
        OR (t.description LIKE '%Monthly invoice%' AND si.description LIKE '%Monthly invoice%')
        OR (t.description LIKE '%Initial invoice%' AND si.description LIKE '%Initial invoice%')
        OR (t.description LIKE '%First month%' AND si.description LIKE '%First month%')
      )
      WHERE DATE(si.invoice_date) = '2025-10-01'
        AND DATE(t.transaction_date) = '2025-09-30'
        AND t.deleted_at IS NULL
        AND si.deleted_at IS NULL
      ORDER BY t.id
    `;

    const [transactions] = await connection.query(transactionQuery);
    
    console.log(`   Found ${transactions.length} transactions with date 2025-09-30 linked to October invoices`);
    console.log('');

    // 2b. Find invoices without transactions
    console.log('2️⃣b Finding invoices WITHOUT linked transactions...');
    const [invoicesWithoutTx] = await connection.query(`
      SELECT 
        si.id as invoice_id,
        si.invoice_date,
        si.amount,
        si.description,
        si.reference_number,
        se.boarding_house_id,
        se.id as enrollment_id,
        s.full_name as student_name,
        s.id as student_id
      FROM student_invoices si
      JOIN student_enrollments se ON si.enrollment_id = se.id
      JOIN students s ON si.student_id = s.id
      WHERE DATE(si.invoice_date) = '2025-10-01'
        AND si.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND s.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM transactions t
          WHERE t.deleted_at IS NULL
            AND (
              (t.reference = si.reference_number AND si.reference_number IS NOT NULL)
              OR t.description LIKE CONCAT('%', si.reference_number, '%')
              OR t.description LIKE CONCAT('%', s.full_name, '%')
              OR (t.description LIKE '%First month%' AND si.description LIKE '%First month%' AND t.description LIKE CONCAT('%', s.full_name, '%'))
            )
        )
      ORDER BY si.id
    `);

    console.log(`   Found ${invoicesWithoutTx.length} invoices without linked transactions`);
    if (invoicesWithoutTx.length > 0) {
      console.log('   Missing invoices:');
      invoicesWithoutTx.forEach((inv, idx) => {
        console.log(`     ${idx + 1}. Invoice ID ${inv.invoice_id} | ${inv.student_name} | $${inv.amount} | ${inv.reference_number || 'N/A'}`);
      });
      console.log('');

      // Try to find transactions by student name and date range
      console.log('   Searching for transactions by student name...');
      for (const invoice of invoicesWithoutTx) {
        const [potentialTx] = await connection.query(`
          SELECT 
            t.id,
            t.transaction_date,
            t.reference,
            t.description,
            t.transaction_type,
            t.status
          FROM transactions t
          WHERE t.deleted_at IS NULL
            AND (
              t.description LIKE ?
              OR (t.description LIKE ? AND t.description LIKE ?)
            )
            AND (
              DATE(t.transaction_date) = '2025-09-30'
              OR DATE(t.transaction_date) = '2025-10-01'
              OR DATE(t.transaction_date) BETWEEN '2025-09-25' AND '2025-10-05'
            )
          ORDER BY t.id
        `, [
          `%${invoice.student_name}%`,
          `%First month%`,
          `%${invoice.student_name}%`
        ]);

        if (potentialTx.length > 0) {
          console.log(`     Invoice ${invoice.invoice_id} (${invoice.student_name}):`);
          potentialTx.forEach(tx => {
            const txDate = new Date(tx.transaction_date).toISOString().split('T')[0];
            console.log(`       Found: Txn ${tx.id} | ${txDate} | ${tx.reference || 'N/A'}`);
            console.log(`         Description: ${tx.description?.substring(0, 80)}...`);
            
            // Add to transactions array if date is Sept 30
            if (txDate === '2025-09-30') {
              transactions.push({
                transaction_id: tx.id,
                transaction_date: tx.transaction_date,
                reference: tx.reference,
                description: tx.description,
                transaction_type: tx.transaction_type,
                invoice_id: invoice.invoice_id,
                invoice_date: invoice.invoice_date,
                invoice_ref: invoice.reference_number
              });
            }
          });
          console.log('');
        } else {
          console.log(`     Invoice ${invoice.invoice_id} (${invoice.student_name}): No transactions found`);
          console.log(`       ⚠️  This invoice has NO transaction - missing $${invoice.amount}`);
          console.log('');
        }
      }
    }
    console.log('');

    if (transactions.length === 0) {
      console.log('   ⚠️  No transactions found to update. They may already be correct or not linked.');
      console.log('   Checking for transactions by description pattern...');
      
      // Try a broader search - find transactions with October invoice references in description
      const [broaderTransactions] = await connection.query(`
        SELECT DISTINCT
          t.id as transaction_id,
          t.transaction_date,
          t.reference,
          t.description
        FROM transactions t
        WHERE DATE(t.transaction_date) = '2025-09-30'
          AND t.deleted_at IS NULL
          AND (
            t.description LIKE '%2025-10%'
            OR t.description LIKE '%Monthly invoice%2025-10%'
            OR t.description LIKE '%INV-2025-10%'
          )
        ORDER BY t.id
      `);
      
      console.log(`   Found ${broaderTransactions.length} transactions with September 30 date but October references`);
      
      if (broaderTransactions.length > 0) {
        console.log('   Sample transactions:');
        broaderTransactions.slice(0, 5).forEach(tx => {
          console.log(`     Txn ${tx.transaction_id}: ${tx.transaction_date} | ${tx.reference || 'N/A'} | ${tx.description?.substring(0, 60)}...`);
        });
        
        // Update these transactions
        const updateCount = await connection.query(`
          UPDATE transactions
          SET transaction_date = '2025-10-01'
          WHERE DATE(transaction_date) = '2025-09-30'
            AND deleted_at IS NULL
            AND (
              description LIKE '%2025-10%'
              OR description LIKE '%Monthly invoice%2025-10%'
              OR description LIKE '%INV-2025-10%'
            )
        `);
        
        console.log(`   ✅ Updated ${updateCount[0].affectedRows} transactions to 2025-10-01`);
      }
      
      await connection.commit();
      return;
    }

    // 3. Show what will be updated
    console.log('3️⃣  Transactions to update:');
    transactions.slice(0, 10).forEach((tx, idx) => {
      console.log(`   ${idx + 1}. Txn ${tx.transaction_id} | ${tx.transaction_date} → 2025-10-01`);
      console.log(`      Reference: ${tx.reference || 'N/A'}`);
      console.log(`      Invoice ID: ${tx.invoice_id} (invoice_date: ${tx.invoice_date})`);
      console.log(`      Description: ${tx.description?.substring(0, 60)}...`);
    });
    if (transactions.length > 10) {
      console.log(`   ... and ${transactions.length - 10} more`);
    }
    console.log('');

    // 4. Update transaction dates
    console.log('4️⃣  Updating transaction dates...');
    const transactionIds = transactions.map(tx => tx.transaction_id);
    
    const [updateResult] = await connection.query(`
      UPDATE transactions
      SET transaction_date = '2025-10-01'
      WHERE id IN (?)
        AND DATE(transaction_date) = '2025-09-30'
        AND deleted_at IS NULL
    `, [transactionIds]);

    console.log(`   ✅ Updated ${updateResult.affectedRows} transactions to 2025-10-01`);
    console.log('');

    // 5. Also update journal entries created_at to match (if they were created with wrong date)
    console.log('5️⃣  Updating journal entries created_at to match transaction_date...');
    const [journalUpdate] = await connection.query(`
      UPDATE journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      SET je.created_at = CONCAT(DATE(t.transaction_date), ' ', TIME(je.created_at))
      WHERE t.id IN (?)
        AND DATE(t.transaction_date) = '2025-10-01'
        AND DATE(je.created_at) != '2025-10-01'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
    `, [transactionIds]);

    console.log(`   ✅ Updated ${journalUpdate.affectedRows} journal entries created_at dates`);
    console.log('');

    // 6. Verify the updates
    console.log('6️⃣  Verifying updates...');
    const [verifyResults] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN DATE(transaction_date) = '2025-10-01' THEN 1 END) as october_count,
        COUNT(CASE WHEN DATE(transaction_date) = '2025-09-30' THEN 1 END) as september_count
      FROM transactions
      WHERE id IN (?)
        AND deleted_at IS NULL
    `, [transactionIds]);

    console.log(`   Total transactions: ${verifyResults[0].total}`);
    console.log(`   October 1 dates: ${verifyResults[0].october_count}`);
    console.log(`   September 30 dates: ${verifyResults[0].september_count}`);
    console.log('');

    // Commit transaction
    await connection.commit();
    console.log('✅ All updates committed successfully!');
    console.log('');

    // 7. Summary
    console.log('='.repeat(80));
    console.log('✅ FIX COMPLETE');
    console.log('='.repeat(80));
    console.log(`   Invoices checked: ${invoices.length}`);
    console.log(`   Transactions updated: ${updateResult.affectedRows}`);
    console.log(`   Journal entries updated: ${journalUpdate.affectedRows}`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:');
    console.error(error.message);
    console.error('');
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    if (connection) {
      await connection.rollback();
      console.log('   🔄 Transaction rolled back');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
    console.log('🔌 Database connection closed.');
  }
}

// Run the fix
fixOctoberTransactionDates()
  .then(() => {
    console.log('');
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Script failed:');
    console.error(error);
    process.exit(1);
  });

