const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function checkLeonaBalance() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Finding Leona Dengu...\n');

    // Find the student and their balance
    const [students] = await connection.query(
      `SELECT 
        s.id as student_id,
        s.full_name,
        s.status as student_status,
        se.id as enrollment_id,
        se.start_date,
        se.expected_end_date,
        se.checkout_date,
        se.checkout_reason,
        se.agreed_amount,
        se.admin_fee,
        se.security_deposit,
        sab.current_balance,
        sab.currency,
        sab.updated_at as balance_updated_at,
        r.name as room_name,
        bh.name as boarding_house_name
       FROM students s
       LEFT JOIN student_enrollments se ON s.id = se.student_id
       LEFT JOIN student_account_balances sab ON s.id = sab.student_id 
         AND se.id = sab.enrollment_id
       LEFT JOIN rooms r ON se.room_id = r.id
       LEFT JOIN boarding_houses bh ON se.boarding_house_id = bh.id
       WHERE s.full_name LIKE '%Leona%Dengu%'
         OR s.full_name LIKE '%Dengu%Leona%'
         OR s.full_name LIKE '%Leona%'
       ORDER BY se.created_at DESC`,
      []
    );

    if (students.length === 0) {
      console.log('❌ Student not found');
      return;
    }

    console.log(`✅ Found ${students.length} record(s) for Leona Dengu:\n`);

    students.forEach((student, index) => {
      console.log(`--- Record ${index + 1} ---`);
      console.log(`Student ID: ${student.student_id}`);
      console.log(`Full Name: ${student.full_name}`);
      console.log(`Student Status: ${student.student_status || 'N/A'}`);
      console.log(`Enrollment ID: ${student.enrollment_id || 'N/A'}`);
      console.log(`Room: ${student.room_name || 'N/A'}`);
      console.log(`Boarding House: ${student.boarding_house_name || 'N/A'}`);
      console.log(`Start Date: ${student.start_date || 'N/A'}`);
      console.log(`Expected End Date: ${student.expected_end_date || 'N/A'}`);
      console.log(`Checkout Date: ${student.checkout_date || 'Not checked out'}`);
      console.log(`Checkout Reason: ${student.checkout_reason || 'N/A'}`);
      console.log(`Agreed Amount (Rent): ${student.agreed_amount || 0}`);
      console.log(`Admin Fee: ${student.admin_fee || 0}`);
      console.log(`Security Deposit: ${student.security_deposit || 0}`);
      console.log(`Current Balance: ${student.current_balance !== null ? student.current_balance : 'No balance record'}`);
      console.log(`Currency: ${student.currency || 'N/A'}`);
      console.log(`Balance Updated: ${student.balance_updated_at || 'N/A'}`);
      console.log('');
    });

    // Get payment summary
    if (students[0].student_id) {
      const [payments] = await connection.query(
        `SELECT 
          SUM(CASE WHEN payment_type = 'monthly_rent' THEN amount ELSE 0 END) as total_rent_paid,
          SUM(CASE WHEN payment_type = 'admin_fee' THEN amount ELSE 0 END) as total_admin_fee_paid,
          SUM(CASE WHEN payment_type = 'security_deposit' THEN amount ELSE 0 END) as total_deposit_paid,
          SUM(amount) as total_payments,
          COUNT(*) as payment_count
         FROM student_payments
         WHERE student_id = ?
           AND deleted_at IS NULL
           AND status = 'completed'`,
        [students[0].student_id]
      );

      if (payments.length > 0 && payments[0].total_payments > 0) {
        console.log('--- Payment Summary ---');
        console.log(`Total Rent Paid: ${payments[0].total_rent_paid || 0}`);
        console.log(`Total Admin Fee Paid: ${payments[0].total_admin_fee_paid || 0}`);
        console.log(`Total Deposit Paid: ${payments[0].total_deposit_paid || 0}`);
        console.log(`Total Payments: ${payments[0].total_payments || 0}`);
        console.log(`Number of Payments: ${payments[0].payment_count || 0}`);
        console.log('');
      }

      // Get invoice summary
      const [invoices] = await connection.query(
        `SELECT 
          SUM(amount) as total_invoiced,
          COUNT(*) as invoice_count
         FROM student_invoices
         WHERE student_id = ?
           AND deleted_at IS NULL`,
        [students[0].student_id]
      );

      if (invoices.length > 0 && invoices[0].total_invoiced > 0) {
        console.log('--- Invoice Summary ---');
        console.log(`Total Invoiced: ${invoices[0].total_invoiced || 0}`);
        console.log(`Number of Invoices: ${invoices[0].invoice_count || 0}`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

checkLeonaBalance()
  .then(() => {
    console.log('✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

