const mysql = require('mysql2/promise');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'password123', // Add your password here if needed
  database: 'alamait',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function runAutomaticPayments() {
  let connection;
  
  try {
    console.log('🚀 Starting Automatic Payments Process...');
    console.log('📅 Date:', new Date().toISOString());
    console.log('---');

    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    // Step 0: Check boarding houses and petty cash accounts
    console.log('\n🏠 Step 0: Checking boarding houses and petty cash accounts...');
    const [boardingHouses] = await connection.execute(`
      SELECT id, name, location 
      FROM boarding_houses 
      WHERE deleted_at IS NULL
      ORDER BY id
    `);
    
    console.log('Available boarding houses:');
    boardingHouses.forEach(bh => {
      console.log(`  - ID ${bh.id}: ${bh.name} (${bh.location})`);
    });

    const [pettyCashAccounts] = await connection.execute(`
      SELECT pca.boarding_house_id, bh.name as boarding_house_name, 
             pca.current_balance, pca.total_inflows, pca.total_outflows
      FROM petty_cash_accounts pca
      LEFT JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
      ORDER BY pca.boarding_house_id
    `);
    
    console.log('\nExisting petty cash accounts:');
    pettyCashAccounts.forEach(pca => {
      console.log(`  - Boarding House ${pca.boarding_house_id} (${pca.boarding_house_name}): $${parseFloat(pca.current_balance || 0).toFixed(2)}`);
    });

    // Step 1: Check pending payment schedules
    console.log('\n📋 Step 1: Checking pending payment schedules...');
    const [pendingSchedules] = await connection.execute(`
      SELECT 
        sps.id as schedule_id,
        sps.enrollment_id,
        sps.student_id,
        s.full_name,
        sps.period_start_date,
        sps.period_end_date,
        sps.amount_due,
        sps.amount_paid,
        sps.currency,
        sps.status,
        se.boarding_house_id
      FROM student_payment_schedules sps
      JOIN students s ON sps.student_id = s.id
      JOIN student_enrollments se ON sps.enrollment_id = se.id
      WHERE se.boarding_house_id = 4 
        AND sps.status = 'pending'
        AND sps.deleted_at IS NULL
        AND s.deleted_at IS NULL
        AND se.deleted_at IS NULL
      ORDER BY sps.student_id, sps.period_start_date
    `);

    console.log(`Found ${pendingSchedules.length} pending payment schedules for boarding house ID 4:`);
    pendingSchedules.forEach(schedule => {
      console.log(`  - ${schedule.full_name}: $${schedule.amount_due} for ${schedule.period_start_date} (Boarding House ID: ${schedule.boarding_house_id})`);
    });

    if (pendingSchedules.length === 0) {
      console.log('❌ No pending payment schedules found. Exiting...');
      return;
    }

    // Step 2: Get account IDs
    console.log('\n🏦 Step 2: Getting account IDs...');
    const [cashAccounts] = await connection.execute(`
      SELECT id, code, name FROM chart_of_accounts 
      WHERE code = '10002' AND deleted_at IS NULL
    `);
    
    const [rentalAccounts] = await connection.execute(`
      SELECT id, code, name FROM chart_of_accounts 
      WHERE code = '40001' AND deleted_at IS NULL
    `);

    if (cashAccounts.length === 0) {
      throw new Error('Cash account (10002) not found in chart of accounts');
    }
    if (rentalAccounts.length === 0) {
      throw new Error('Rental Income account (40001) not found in chart of accounts');
    }

    const cashAccountId = cashAccounts[0].id;
    const rentalAccountId = rentalAccounts[0].id;
    
    console.log(`✅ Cash Account: ${cashAccounts[0].code} - ${cashAccounts[0].name} (ID: ${cashAccountId})`);
    console.log(`✅ Rental Income Account: ${rentalAccounts[0].code} - ${rentalAccounts[0].name} (ID: ${rentalAccountId})`);

    // Step 3: Start transaction
    console.log('\n💾 Step 3: Starting database transaction...');
    await connection.beginTransaction();

    const userId = 1;

    // Step 4: Create transactions
    console.log('\n💰 Step 4: Creating transactions...');
    for (const schedule of pendingSchedules) {
      // Use the period start date as the transaction date
      const transactionDate = schedule.period_start_date;
      const transactionDateStr = transactionDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
      const reference = `PMT-${transactionDateStr.replace(/-/g, '')}-${schedule.schedule_id}`;
      const description = `Monthly rent payment for ${new Date(schedule.period_start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - Cash payment`;
      
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
          created_at,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `, [
        'monthly_rent',
        schedule.student_id,
        reference,
        schedule.amount_due,
        schedule.currency,
        description,
        transactionDateStr,
        schedule.boarding_house_id,
        userId,
        'posted'
      ]);

      console.log(`  ✅ Created transaction ${transactionResult.insertId} for ${schedule.full_name}: $${schedule.amount_due} for ${transactionDateStr} (${schedule.boarding_house_id})`);

      // Step 5: Create journal entries
      const transactionId = transactionResult.insertId;
      
      // Debit entry (Cash)
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
        cashAccountId,
        'debit',
        schedule.amount_due,
        `Monthly rent payment - Debit Cash for ${schedule.full_name}`,
        schedule.boarding_house_id,
        userId
      ]);

      // Credit entry (Rental Income)
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
        rentalAccountId,
        'credit',
        schedule.amount_due,
        `Monthly rent payment - Credit Rental Income for ${schedule.full_name}`,
        schedule.boarding_house_id,
        userId
      ]);

      console.log(`  ✅ Created journal entries for transaction ${transactionId}`);

      // Step 6: Create student payment record
      await connection.execute(`
        INSERT INTO student_payments (
          student_id,
          enrollment_id,
          schedule_id,
          transaction_id,
          amount,
          payment_date,
          payment_method,
          payment_type,
          reference_number,
          notes,
          created_by,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        schedule.student_id,
        schedule.enrollment_id,
        schedule.schedule_id,
        transactionId,
        schedule.amount_due,
        transactionDateStr,
        'cash',
        'monthly_rent',
        reference,
        `Automatic cash payment for ${new Date(schedule.period_start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        userId,
        'completed'
      ]);

      console.log(`  ✅ Created student payment record for ${schedule.full_name}`);

      // Step 7: Create petty cash transaction
      await connection.execute(`
        INSERT INTO petty_cash_transactions (
          boarding_house_id,
          transaction_type,
          amount,
          description,
          reference_number,
          notes,
          transaction_date,
          created_by,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        schedule.boarding_house_id,
        'student_payment',
        schedule.amount_due,
        `Student payment - monthly rent for ${schedule.full_name}`,
        reference,
        `Automatic cash payment for ${new Date(schedule.period_start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        transactionDateStr,
        userId
      ]);

      console.log(`  ✅ Created petty cash transaction for ${schedule.full_name} (${schedule.boarding_house_id})`);
    }

    // Step 8: Update payment schedules to 'paid' status
    console.log('\n✅ Step 8: Updating payment schedules to paid status...');
    
    // First, get the IDs of schedules to update
    const [scheduleIdsToUpdate] = await connection.execute(`
      SELECT sps2.id
      FROM student_payment_schedules sps2
      JOIN student_enrollments se ON sps2.enrollment_id = se.id
      WHERE se.boarding_house_id = 4 
        AND sps2.status = 'pending'
        AND sps2.deleted_at IS NULL
        AND se.deleted_at IS NULL
    `);
    
    if (scheduleIdsToUpdate.length > 0) {
      const ids = scheduleIdsToUpdate.map(row => row.id);
      const placeholders = ids.map(() => '?').join(',');
      
      const [updateResult] = await connection.execute(`
        UPDATE student_payment_schedules 
        SET 
          status = 'paid',
          amount_paid = amount_due,
          updated_at = NOW()
        WHERE id IN (${placeholders})
      `, ids);
      
      console.log(`✅ Updated ${updateResult.affectedRows} payment schedules to paid status`);
    } else {
      console.log('✅ No payment schedules to update');
    }

    // Step 9: Update petty cash account balance
    console.log('\n💵 Step 9: Updating petty cash account balance...');
    const totalAmount = pendingSchedules.reduce((sum, schedule) => sum + parseFloat(schedule.amount_due), 0);
    
    await connection.execute(`
      INSERT INTO petty_cash_accounts (
        boarding_house_id,
        current_balance,
        total_inflows,
        created_at
      ) VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        current_balance = current_balance + ?,
        total_inflows = total_inflows + ?,
        updated_at = NOW()
    `, [4, totalAmount, totalAmount, totalAmount, totalAmount]);

    console.log(`✅ Updated petty cash account with $${totalAmount.toFixed(2)}`);

    // Step 10: Commit transaction
    console.log('\n💾 Step 10: Committing transaction...');
    await connection.commit();
    console.log('✅ Transaction committed successfully!');

    // Step 11: Verification
    console.log('\n📊 Step 11: Verification...');
    
    // Check created transactions
    const [transactions] = await connection.execute(`
      SELECT COUNT(*) as count FROM transactions 
      WHERE transaction_type = 'monthly_rent' 
        AND boarding_house_id = 4 
        AND created_at >= NOW() - INTERVAL 5 MINUTE
    `);
    console.log(`✅ Created ${transactions[0].count} transactions`);

    // Check created journal entries
    const [journalEntries] = await connection.execute(`
      SELECT COUNT(*) as count FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      WHERE t.transaction_type = 'monthly_rent' 
        AND t.boarding_house_id = 4 
        AND t.created_at >= NOW() - INTERVAL 5 MINUTE
    `);
    console.log(`✅ Created ${journalEntries[0].count} journal entries`);

    // Check created student payments
    const [studentPayments] = await connection.execute(`
      SELECT COUNT(*) as count FROM student_payments 
      WHERE created_at >= NOW() - INTERVAL 5 MINUTE
    `);
    console.log(`✅ Created ${studentPayments[0].count} student payments`);

    // Check petty cash transactions
    const [pettyCashTransactions] = await connection.execute(`
      SELECT COUNT(*) as count FROM petty_cash_transactions 
      WHERE boarding_house_id = 4 
        AND created_at >= NOW() - INTERVAL 5 MINUTE
    `);
    console.log(`✅ Created ${pettyCashTransactions[0].count} petty cash transactions`);

    // Check petty cash account balance
    const [pettyCashAccount] = await connection.execute(`
      SELECT current_balance, total_inflows, total_outflows 
      FROM petty_cash_accounts 
      WHERE boarding_house_id = 4
    `);
    
    if (pettyCashAccount.length > 0) {
      const balance = parseFloat(pettyCashAccount[0].current_balance) || 0;
      const inflows = parseFloat(pettyCashAccount[0].total_inflows) || 0;
      const outflows = parseFloat(pettyCashAccount[0].total_outflows) || 0;
      
      console.log(`✅ Petty cash account balance: $${balance.toFixed(2)}`);
      console.log(`✅ Total inflows: $${inflows.toFixed(2)}`);
      console.log(`✅ Total outflows: $${outflows.toFixed(2)}`);
    }

    console.log('\n🎉 Automatic payments process completed successfully!');
    console.log(`📈 Total amount processed: $${totalAmount.toFixed(2)}`);
    console.log(`👥 Students processed: ${pendingSchedules.length}`);
    console.log(`🏠 Boarding house: ID 4 (ST Kilda)`);

  } catch (error) {
    console.error('\n❌ Error occurred during automatic payments process:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (connection) {
      console.log('\n🔄 Rolling back transaction...');
      await connection.rollback();
      console.log('✅ Transaction rolled back');
    }
    
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  runAutomaticPayments()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runAutomaticPayments };
