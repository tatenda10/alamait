require('dotenv').config();
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function findMissingTransactions() {
  let connection;

  try {
    console.log('='.repeat(80));
    console.log('FINDING MISSING OCTOBER TRANSACTIONS');
    console.log('='.repeat(80));
    console.log('');

    // Connect to database
    console.log('📊 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    await connection.query("SET time_zone = '+00:00'");
    console.log('✅ Connected\n');

    // 1. Get all invoices with invoice_date = 2025-10-01
    console.log('1️⃣  Getting all invoices with invoice_date = 2025-10-01...');
    const [invoices] = await connection.query(`
      SELECT 
        si.id as invoice_id,
        si.invoice_date,
        si.amount,
        si.description,
        si.reference_number,
        se.boarding_house_id,
        se.id as enrollment_id,
        s.full_name as student_name
      FROM student_invoices si
      JOIN student_enrollments se ON si.enrollment_id = se.id
      JOIN students s ON si.student_id = s.id
      WHERE DATE(si.invoice_date) = '2025-10-01'
        AND si.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND s.deleted_at IS NULL
      ORDER BY si.id
    `);

    console.log(`   Found ${invoices.length} invoices`);
    console.log('');

    // 2. For each invoice, try to find linked transactions
    console.log('2️⃣  Finding transactions for each invoice...');
    const invoicesWithTransactions = [];
    const invoicesWithoutTransactions = [];

    for (const invoice of invoices) {
      // Try multiple matching strategies
      const [transactions] = await connection.query(`
        SELECT DISTINCT
          t.id as transaction_id,
          t.transaction_date,
          t.reference,
          t.description,
          t.transaction_type,
          t.status
        FROM transactions t
        WHERE t.deleted_at IS NULL
          AND (
            (t.reference = ? AND ? IS NOT NULL)
            OR t.description LIKE CONCAT('%', ?, '%')
            OR t.description LIKE CONCAT('%Invoice - ', ?, '%')
            OR (t.description LIKE ? AND t.description LIKE CONCAT('%', ?, '%'))
            OR (t.description LIKE ? AND t.description LIKE CONCAT('%', ?, '%'))
          )
        ORDER BY t.id
      `, [
        invoice.reference_number,
        invoice.reference_number,
        invoice.reference_number || '',
        invoice.invoice_id,
        '%Monthly invoice%',
        invoice.student_name,
        '%Initial invoice%',
        invoice.student_name
      ]);

      if (transactions.length > 0) {
        invoicesWithTransactions.push({
          invoice,
          transactions
        });
      } else {
        invoicesWithoutTransactions.push(invoice);
      }
    }

    console.log(`   Invoices WITH transactions: ${invoicesWithTransactions.length}`);
    console.log(`   Invoices WITHOUT transactions: ${invoicesWithoutTransactions.length}`);
    console.log('');

    // 3. Show invoices without transactions
    if (invoicesWithoutTransactions.length > 0) {
      console.log('3️⃣  Invoices WITHOUT linked transactions:');
      invoicesWithoutTransactions.forEach((inv, idx) => {
        console.log(`   ${idx + 1}. Invoice ID ${inv.invoice_id}`);
        console.log(`      Student: ${inv.student_name}`);
        console.log(`      Amount: $${inv.amount}`);
        console.log(`      Reference: ${inv.reference_number || 'N/A'}`);
        console.log(`      Description: ${inv.description?.substring(0, 60)}...`);
        console.log(`      Enrollment ID: ${inv.enrollment_id}`);
        console.log('');
      });

      // 4. Check if there are transactions that might match but weren't found
      console.log('4️⃣  Searching for potential matching transactions...');
      for (const invoice of invoicesWithoutTransactions) {
        // Search by student name in description
        const [potentialMatches] = await connection.query(`
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
              OR t.description LIKE ?
            )
          ORDER BY t.id
        `, [
          `%${invoice.student_name}%`,
          `%${invoice.description?.substring(0, 30)}%`
        ]);

        if (potentialMatches.length > 0) {
          console.log(`   Invoice ${invoice.invoice_id} (${invoice.student_name}):`);
          potentialMatches.forEach(tx => {
            console.log(`     Potential match: Txn ${tx.id} | ${tx.transaction_date} | ${tx.reference || 'N/A'}`);
            console.log(`       Description: ${tx.description?.substring(0, 80)}...`);
          });
          console.log('');
        }
      }

      // 5. Calculate missing revenue
      const missingRevenue = invoicesWithoutTransactions.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
      console.log('5️⃣  Missing Revenue Summary:');
      console.log(`   Missing invoices: ${invoicesWithoutTransactions.length}`);
      console.log(`   Missing revenue amount: $${missingRevenue.toFixed(2)}`);
      console.log(`   Expected total: $9660.00`);
      console.log(`   Current total: $${(9660 - missingRevenue).toFixed(2)}`);
      console.log('');
    } else {
      console.log('   ✅ All invoices have linked transactions!');
      console.log('');
    }

    // 6. Check transactions with September 30 date that might be for these invoices
    console.log('6️⃣  Checking for transactions with September 30 date that might match...');
    const [sept30Transactions] = await connection.query(`
      SELECT 
        t.id,
        t.transaction_date,
        t.reference,
        t.description,
        t.transaction_type,
        t.status
      FROM transactions t
      WHERE DATE(t.transaction_date) = '2025-09-30'
        AND t.deleted_at IS NULL
        AND (
          t.description LIKE '%2025-10%'
          OR t.description LIKE '%October%'
          OR t.reference LIKE 'INV-2025-10%'
        )
      ORDER BY t.id
    `);

    if (sept30Transactions.length > 0) {
      console.log(`   Found ${sept30Transactions.length} transactions with Sept 30 date but October references:`);
      sept30Transactions.forEach(tx => {
        console.log(`     Txn ${tx.id} | ${tx.transaction_date} | ${tx.reference || 'N/A'}`);
        console.log(`       Description: ${tx.description?.substring(0, 80)}...`);
      });
      console.log('');
    } else {
      console.log('   No September 30 transactions with October references found');
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('✅ ANALYSIS COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:');
    console.error(error.message);
    console.error('');
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
    console.log('🔌 Database connection closed.');
  }
}

// Run the analysis
findMissingTransactions()
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

