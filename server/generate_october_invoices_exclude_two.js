require('dotenv').config();
const mysql = require('mysql2/promise');

async function generateOctoberInvoices() {
  console.log('📄 Generating October 2025 Invoices...\n');
  console.log('Excluding: Leona Dengu, Shelter Masosonere\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    // Get all active students with enrollments, excluding Leona and Shelter
    const [students] = await connection.execute(`
      SELECT 
        s.id as student_id,
        s.student_id as student_number,
        s.full_name,
        se.id as enrollment_id,
        se.agreed_amount as monthly_rent,
        se.currency,
        bh.id as boarding_house_id,
        bh.name as boarding_house,
        r.name as room_name
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      LEFT JOIN rooms r ON se.room_id = r.id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= '2025-10-01')
        AND s.full_name NOT LIKE '%Leona%Dengu%'
        AND s.full_name NOT LIKE '%Shelter%Masosonere%'
      ORDER BY s.full_name
    `);

    console.log(`Found ${students.length} active students (excluding Leona & Shelter)\n`);

    let invoicesCreated = 0;
    let totalInvoiceAmount = 0;
    const invoiceMonth = '2025-10';
    const invoiceDate = '2025-10-01';

    for (const student of students) {
      const monthlyFee = parseFloat(student.monthly_rent) || 180; // Use agreed_amount from enrollment
      
      // Create transaction record
      const [transactionResult] = await connection.execute(`
        INSERT INTO transactions (
          transaction_type,
          student_id,
          reference,
          amount,
          currency,
          description,
          transaction_date,
          boarding_house_id,
          created_by,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        'monthly_invoice',
        student.student_id,
        `INV-${invoiceMonth}-${student.enrollment_id}`,
        monthlyFee,
        student.currency || 'USD',
        `Monthly invoice - ${student.full_name} - October 2025`,
        invoiceDate,
        student.boarding_house_id,
        1 // Default to user 1
      ]);

      const transactionId = transactionResult.insertId;

      // Update student account balance (debit - increases what student owes)
      await connection.execute(`
        UPDATE student_account_balances
        SET current_balance = current_balance - ?,
            updated_at = NOW()
        WHERE student_id = ?
      `, [monthlyFee, student.student_id]);

      // Get account IDs for journal entries
      const [receivableAccount] = await connection.execute(
        'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
        ['10005'] // Accounts Receivable
      );

      const [revenueAccount] = await connection.execute(
        'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
        ['40001'] // Rentals Income
      );

      // Create journal entries for double-entry accounting
      // Debit: Accounts Receivable (Asset increases)
      await connection.execute(`
        INSERT INTO journal_entries (
          transaction_id,
          account_id,
          entry_type,
          amount,
          description,
          boarding_house_id,
          created_by,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        transactionId,
        receivableAccount[0].id,
        'debit',
        monthlyFee,
        `Monthly invoice - Debit Accounts Receivable`,
        student.boarding_house_id,
        1
      ]);

      // Credit: Revenue Account
      await connection.execute(`
        INSERT INTO journal_entries (
          transaction_id,
          account_id,
          entry_type,
          amount,
          description,
          boarding_house_id,
          created_by,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        transactionId,
        revenueAccount[0].id,
        'credit',
        monthlyFee,
        `Monthly invoice - Credit Rentals Income`,
        student.boarding_house_id,
        1
      ]);

      invoicesCreated++;
      totalInvoiceAmount += monthlyFee;

      console.log(`✓ ${student.full_name} (${student.room_name || 'No Room'}) - $${monthlyFee.toFixed(2)}`);
    }

    await connection.commit();

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 INVOICE GENERATION SUMMARY:');
    console.log(`✅ Invoices Created: ${invoicesCreated}`);
    console.log(`💰 Total Invoice Amount: $${totalInvoiceAmount.toFixed(2)}`);
    console.log(`📅 Invoice Month: October 2025`);
    console.log(`📅 Invoice Date: ${invoiceDate}`);

    // Get updated totals
    const [totals] = await connection.execute(`
      SELECT 
        SUM(CASE WHEN sab.current_balance > 0 THEN sab.current_balance ELSE 0 END) as total_prepayments,
        SUM(CASE WHEN sab.current_balance < 0 THEN ABS(sab.current_balance) ELSE 0 END) as total_debtors,
        SUM(sab.current_balance) as net_balance
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
    `);

    console.log('\n📊 UPDATED STUDENT BALANCES:');
    console.log(`  Prepayments: $${parseFloat(totals[0].total_prepayments || 0).toFixed(2)}`);
    console.log(`  Debtors: $${parseFloat(totals[0].total_debtors || 0).toFixed(2)}`);
    console.log(`  Net Balance: $${parseFloat(totals[0].net_balance || 0).toFixed(2)}`);

    console.log('\n✅ October invoices generated successfully!');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

generateOctoberInvoices();

