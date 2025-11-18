const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function fixTanakaBalance() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.beginTransaction();

    console.log('🔍 Finding Tanaka Matematema...\n');

    // Find the student
    const [students] = await connection.query(
      `SELECT id, full_name, student_number 
       FROM students 
       WHERE full_name LIKE '%Tanaka%Matematema%' 
         AND deleted_at IS NULL`,
      []
    );

    if (students.length === 0) {
      console.log('❌ Student not found');
      return;
    }

    const student = students[0];
    console.log(`✅ Found student: ${student.full_name} (ID: ${student.id})\n`);

    // Get current enrollment and balance
    const [enrollments] = await connection.query(
      `SELECT se.id as enrollment_id, se.agreed_amount, se.admin_fee,
              sab.current_balance
       FROM student_enrollments se
       LEFT JOIN student_account_balances sab ON se.student_id = sab.student_id 
         AND se.id = sab.enrollment_id
       WHERE se.student_id = ? 
         AND se.deleted_at IS NULL
       ORDER BY se.created_at DESC
       LIMIT 1`,
      [student.id]
    );

    if (enrollments.length === 0) {
      console.log('❌ No enrollment found for this student');
      await connection.rollback();
      return;
    }

    const enrollment = enrollments[0];
    console.log(`📊 Current balance: ${enrollment.current_balance || 0}`);
    console.log(`💰 Agreed amount (rent): ${enrollment.agreed_amount || 0}`);
    console.log(`💵 Admin fee: ${enrollment.admin_fee || 0}`);
    console.log(`📈 Expected balance: -${(parseFloat(enrollment.agreed_amount || 0) + parseFloat(enrollment.admin_fee || 0)).toFixed(2)}\n`);

    const currentBalance = parseFloat(enrollment.current_balance || 0);
    const expectedBalance = -(parseFloat(enrollment.agreed_amount || 0) + parseFloat(enrollment.admin_fee || 0));
    const difference = expectedBalance - currentBalance;

    if (Math.abs(difference) < 0.01) {
      console.log('✅ Balance is already correct!');
      await connection.rollback();
      return;
    }

    console.log(`🔧 Adjusting balance by: ${difference.toFixed(2)}\n`);

    // Update student account balance
    if (enrollment.enrollment_id) {
      await connection.query(
        `UPDATE student_account_balances 
         SET current_balance = ?,
             updated_at = NOW()
         WHERE student_id = ? AND enrollment_id = ?`,
        [expectedBalance, student.id, enrollment.enrollment_id]
      );
      console.log(`✅ Updated student account balance to ${expectedBalance.toFixed(2)}`);
    } else {
      // Create balance record if it doesn't exist
      await connection.query(
        `INSERT INTO student_account_balances 
         (student_id, enrollment_id, current_balance, currency, created_at, updated_at)
         VALUES (?, ?, ?, 'USD', NOW(), NOW())`,
        [student.id, enrollment.enrollment_id, expectedBalance]
      );
      console.log(`✅ Created student account balance: ${expectedBalance.toFixed(2)}`);
    }

    // Check if we need to update the initial invoice
    const [invoices] = await connection.query(
      `SELECT id, amount, description 
       FROM student_invoices 
       WHERE student_id = ? 
         AND enrollment_id = ?
         AND description LIKE '%First month%'
         AND deleted_at IS NULL
       ORDER BY created_at ASC
       LIMIT 1`,
      [student.id, enrollment.enrollment_id]
    );

    if (invoices.length > 0) {
      const invoice = invoices[0];
      const expectedInvoiceAmount = parseFloat(enrollment.agreed_amount || 0) + parseFloat(enrollment.admin_fee || 0);
      
      if (Math.abs(parseFloat(invoice.amount) - expectedInvoiceAmount) > 0.01) {
        console.log(`\n📝 Updating initial invoice amount from ${invoice.amount} to ${expectedInvoiceAmount.toFixed(2)}`);
        await connection.query(
          `UPDATE student_invoices 
           SET amount = ?,
               description = ?,
               notes = ?
           WHERE id = ?`,
          [
            expectedInvoiceAmount,
            `First month rent + admin fee for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
            `Initial invoice: Monthly rent (USD ${parseFloat(enrollment.agreed_amount || 0).toFixed(2)}) + Admin fee (USD ${parseFloat(enrollment.admin_fee || 0).toFixed(2)})`,
            invoice.id
          ]
        );
        console.log('✅ Updated invoice');
      }
    }

    await connection.commit();
    console.log('\n✅ Successfully fixed Tanaka Matematema\'s balance!');
    console.log(`   New balance: ${expectedBalance.toFixed(2)}`);

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

fixTanakaBalance()
  .then(() => {
    console.log('\n✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

