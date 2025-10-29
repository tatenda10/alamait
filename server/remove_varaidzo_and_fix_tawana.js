require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixStudentData() {
  console.log('🔧 Fixing Student Data...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    // ============================================
    // PART 1: Remove Varaidzo Tafirei completely
    // ============================================
    console.log('1️⃣ Finding Varaidzo Tafirei...');
    
    const [varaidzoStudents] = await connection.execute(`
      SELECT id, student_id, full_name 
      FROM students 
      WHERE full_name LIKE '%Varaidzo%Tafirei%' 
        AND deleted_at IS NULL
    `);

    if (varaidzoStudents.length > 0) {
      const varaidzo = varaidzoStudents[0];
      console.log(`   Found: ${varaidzo.full_name} (ID: ${varaidzo.id}, Student ID: ${varaidzo.student_id})\n`);

      // Get enrollment ID
      const [enrollments] = await connection.execute(`
        SELECT id FROM student_enrollments 
        WHERE student_id = ? AND deleted_at IS NULL
      `, [varaidzo.id]);

      const enrollmentId = enrollments.length > 0 ? enrollments[0].id : null;

      // Delete student account balances
      console.log('   Deleting student account balances...');
      await connection.execute(`
        UPDATE student_account_balances 
        SET deleted_at = NOW() 
        WHERE student_id = ?
      `, [varaidzo.id]);

      // Delete student invoices
      console.log('   Deleting student invoices...');
      const [invoices] = await connection.execute(`
        SELECT id FROM student_invoices 
        WHERE student_id = ? AND deleted_at IS NULL
      `, [varaidzo.id]);
      
      if (invoices.length > 0) {
        await connection.execute(`
          UPDATE student_invoices 
          SET deleted_at = NOW() 
          WHERE student_id = ?
        `, [varaidzo.id]);
        console.log(`   Deleted ${invoices.length} invoice(s)`);
      }

      // Delete transactions and related journal entries
      console.log('   Deleting transactions and journal entries...');
      const [transactions] = await connection.execute(`
        SELECT id FROM transactions 
        WHERE student_id = ? AND deleted_at IS NULL
      `, [varaidzo.id]);

      if (transactions.length > 0) {
        const transactionIds = transactions.map(t => t.id);
        
        // Delete journal entries for these transactions
        await connection.execute(`
          UPDATE journal_entries 
          SET deleted_at = NOW() 
          WHERE transaction_id IN (${transactionIds.join(',')})
        `);
        
        // Delete transactions
        await connection.execute(`
          UPDATE transactions 
          SET deleted_at = NOW() 
          WHERE student_id = ?
        `, [varaidzo.id]);
        
        console.log(`   Deleted ${transactions.length} transaction(s) and their journal entries`);
      }

      // Delete student enrollments
      console.log('   Deleting student enrollments...');
      await connection.execute(`
        UPDATE student_enrollments 
        SET deleted_at = NOW() 
        WHERE student_id = ?
      `, [varaidzo.id]);

      // Delete the student
      console.log('   Deleting student record...');
      await connection.execute(`
        UPDATE students 
        SET deleted_at = NOW() 
        WHERE id = ?
      `, [varaidzo.id]);

      console.log('✅ Varaidzo Tafirei completely removed from system\n');
    } else {
      console.log('   ⚠️ Varaidzo Tafirei not found\n');
    }

    // ============================================
    // PART 2: Fix Tawana's balance to 180
    // ============================================
    console.log('2️⃣ Finding Tawana...');
    
    const [tawanaStudents] = await connection.execute(`
      SELECT 
        s.id,
        s.student_id,
        s.full_name,
        se.id as enrollment_id,
        COALESCE(sab.current_balance, 0) as current_balance
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.full_name LIKE '%Tawana%' 
        AND s.deleted_at IS NULL
    `);

    if (tawanaStudents.length > 0) {
      const tawana = tawanaStudents[0];
      console.log(`   Found: ${tawana.full_name} (ID: ${tawana.id}, Student ID: ${tawana.student_id})`);
      console.log(`   Current Balance: ${tawana.current_balance}`);
      console.log(`   Target Balance: 180\n`);

      if (tawana.enrollment_id) {
        // Update balance to 180
        console.log('   Updating balance to 180...');
        await connection.execute(`
          UPDATE student_account_balances 
          SET current_balance = 180,
              updated_at = NOW() 
          WHERE student_id = ? AND enrollment_id = ?
        `, [tawana.id, tawana.enrollment_id]);

        console.log('✅ Tawana balance updated to 180\n');
      } else {
        console.log('   ⚠️ No enrollment found for Tawana\n');
      }
    } else {
      console.log('   ⚠️ Tawana not found\n');
    }

    // ============================================
    // PART 3: Update account balances
    // ============================================
    console.log('3️⃣ Recalculating Accounts Receivable balance...');
    
    // Get current total from student balances
    const [balanceSum] = await connection.execute(`
      SELECT 
        COALESCE(SUM(current_balance), 0) as total_balance
      FROM student_account_balances sab
      JOIN student_enrollments se ON sab.enrollment_id = se.id
      WHERE sab.deleted_at IS NULL 
        AND se.deleted_at IS NULL
    `);

    console.log(`   Total Student Balances: ${balanceSum[0].total_balance}`);

    // Since we're managing student balances separately, set Accounts Receivable to 0
    const [receivableAccount] = await connection.execute(`
      SELECT id FROM chart_of_accounts WHERE code = '10005' AND deleted_at IS NULL
    `);

    if (receivableAccount.length > 0) {
      await connection.execute(`
        UPDATE current_account_balances 
        SET current_balance = 0,
            updated_at = NOW()
        WHERE account_id = ?
      `, [receivableAccount[0].id]);
      
      console.log('   Set Accounts Receivable (10005) to $0.00\n');
    }

    await connection.commit();

    console.log('✅ All changes completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   ✓ Varaidzo Tafirei removed completely');
    console.log('   ✓ Tawana balance corrected to $180.00');
    console.log('   ✓ Accounts Receivable set to $0.00');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

fixStudentData().catch(console.error);

