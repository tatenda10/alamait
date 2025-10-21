const db = require('../src/services/db');

async function addAllPayments() {
  const conn = await db.getConnection();
  try {
    console.log('Adding ALL payments from the image...\n');
    
    // Complete payment data from the image (all payment columns captured)
    const PAYMENT_DATA = [
      { date: '2025-01-09', name: 'Trypheane Chinembiri', payments: [100, 180] },
      { date: '2025-01-09', name: 'Leona Dengu', payments: [180] },
      { date: '2025-01-09', name: 'Takudzwa Makunde', payments: [390] },
      { date: '2025-01-09', name: 'Kudzai Matare', payments: [200] },
      { date: '2025-01-09', name: 'Shantel Mashe', payments: [298] },
      { date: '2025-01-09', name: 'Anita Gwenda', payments: [200, 140] },
      { date: '2025-01-09', name: 'Lillian Chatikobo', payments: [180, 20] },
      { date: '2025-01-09', name: 'Sharon Matanha', payments: [298] },
      { date: '2025-01-09', name: 'Bellis Mapetere', payments: [200, 180] },
      { date: '2025-01-09', name: 'Tatenda Kamatando', payments: [220] },
      { date: '2025-01-09', name: 'Fay Mubaiwa', payments: [215] },
      { date: '2025-01-09', name: 'Christine Mutsikwa', payments: [180] },
      { date: '2025-01-09', name: 'Bertha Mwangu', payments: [50, 130] },
      { date: '2025-02-09', name: 'Merrylin Makunzva', payments: [50, 180] },
      { date: '2025-02-09', name: 'Shantell Mavarira', payments: [50, 150] },
      { date: '2025-02-09', name: 'Salina Saidi', payments: [40, 170] },
      { date: '2025-02-09', name: 'Tinotenda Bwangangwanyo', payments: [80, 120] },
      { date: '2025-02-09', name: 'Kimberly Nkomo', payments: [100, 80] },
      { date: '2025-01-09', name: 'Kimberly Mutowembwa', payments: [200] },
      { date: '2025-02-09', name: 'Alicia Mutamuko', payments: [50, 150] },
      { date: '2025-02-09', name: 'Tawana Kuwana', payments: [50, 187] },
      { date: '2025-02-09', name: 'Bertha Majoni', payments: [190] },
      { date: '2025-02-09', name: 'Lorraine Mlambo', payments: [120, 70] },
      { date: '2025-02-09', name: 'Tinotenda Magiga', payments: [95, 100] },
      { date: '2025-02-09', name: 'Rumbidzai Manyaora', payments: [48, 100, 20] },
      { date: '2025-02-09', name: 'Precious Mashava', payments: [180] },
      { date: '2025-08-09', name: 'Tanaka Chikonyera', payments: [50, 130] },
      { date: '2025-08-09', name: 'Nyashadzashe Chinorwiwa', payments: [50, 120] },
      { date: '2025-08-09', name: 'Kimbely Bones', payments: [215] },
      { date: '2025-08-09', name: 'Natasha Chinho', payments: [200, 180] },
      { date: '2025-08-09', name: 'Tadiwa', payments: [180] },
      { date: '2025-08-09', name: 'Tadiwa Mhloro', payments: [300] },
      { date: '2025-08-09', name: 'Varaidzo Tafirei', payments: [110] },
      { date: '2025-02-09', name: 'Precious Dziva', payments: [153, 190] },
      { date: '2025-02-09', name: 'Shelter Masosonere', payments: [360, 20] },
      { date: '2025-02-09', name: 'Munashe', payments: [180, 20] },
      { date: '2025-02-09', name: 'Sandra Chirinda', payments: [250, 240] },
      { date: '2025-02-09', name: 'Chantelle Gora', payments: [50, 95] },
      { date: '2025-02-09', name: 'Shalom Gora', payments: [50, 95] },
      { date: '2025-02-09', name: 'Ruvimbo Singe', payments: [180, 200] },
      { date: '2025-02-09', name: 'Thelma Nzvimari', payments: [160, 100] },
      { date: '2025-01-09', name: 'Fadzai Mhizha', payments: [49, 70] },
      { date: '2025-01-09', name: 'Kuziwa', payments: [60, 80] },
      { date: '2025-01-09', name: 'Mitchel Chikosha', payments: [100, 60, 20] },
      { date: '2025-01-09', name: 'Vimbai', payments: [180] },
      { date: '2025-02-09', name: 'Vannessa Magorimbo', payments: [100, 65, 20] },
      { date: '2025-02-09', name: 'Agape Chiware', payments: [180] },
      { date: '2025-02-09', name: 'Paidamoyo Munyimi', payments: [500] },
      { date: '2025-02-09', name: 'Gracious', payments: [180] },
      { date: '2025-02-09', name: 'Grace Vutika', payments: [640] },
      { date: '2025-02-09', name: 'Rachel Madembe', payments: [200, 540] },
      { date: '2025-01-09', name: 'Pelagia Gomakalila', payments: [210, 190] },
      { date: '2025-01-09', name: 'Farai Muzembe', payments: [220] },
      { date: '2025-01-09', name: 'Tinotenda Chidavaenzi', payments: [200] },
      { date: '2025-01-09', name: 'Dion sengamai', payments: [100] },
      { date: '2025-02-09', name: 'Emma Yoradin', payments: [160] },
      { date: '2025-02-09', name: 'Ropafadzo Masara', payments: [150] },
      { date: '2025-02-09', name: 'Kudzai Pemhiwa', payments: [] } // No payments
    ];
    
    console.log(`Processing ${PAYMENT_DATA.length} students with payments from the image...\n`);
    
    // Get account IDs
    const [cashAccountInfo] = await conn.query(
      `SELECT id, code, name FROM chart_of_accounts WHERE code = '10002' AND deleted_at IS NULL`
    );
    const [arAccountInfo] = await conn.query(
      `SELECT id, code, name FROM chart_of_accounts WHERE code = '10005' AND deleted_at IS NULL`
    );
    
    const cashAccountId = cashAccountInfo[0].id;
    const arAccountId = arAccountInfo[0].id;
    
    console.log(`Cash Account: ${cashAccountInfo[0].code} - ${cashAccountInfo[0].name} (ID: ${cashAccountId})`);
    console.log(`AR Account: ${arAccountInfo[0].code} - ${arAccountInfo[0].name} (ID: ${arAccountId})\n`);
    
    let createdCount = 0;
    let totalCashInflow = 0;
    let processedStudents = 0;
    
    for (const data of PAYMENT_DATA) {
      if (data.payments.length === 0) {
        console.log(`⚠️  ${data.name}: No payments`);
        continue;
      }
      
      // Find student by name
      const [students] = await conn.query(
        `SELECT s.id as student_id, s.full_name, se.id as enrollment_id, se.boarding_house_id
         FROM students s
         JOIN student_enrollments se ON s.id = se.student_id
         WHERE LOWER(TRIM(s.full_name)) = LOWER(TRIM(?))
           AND s.deleted_at IS NULL
           AND se.deleted_at IS NULL
         LIMIT 1`,
        [data.name]
      );
      
      if (students.length === 0) {
        console.log(`⚠️  Student not found: ${data.name}`);
        continue;
      }
      
      const student = students[0];
      processedStudents++;
      
      console.log(`Processing ${data.name} (${data.payments.length} payments):`);
      
      // Process each payment for this student
      for (let i = 0; i < data.payments.length; i++) {
        const amount = data.payments[i];
        if (amount <= 0) continue;
        
        // Create payment transaction
        const transactionRef = `PAY-${student.full_name.substring(0, 5)}-${data.date}-${i + 1}`;
        
        const [transactionResult] = await conn.query(
          `INSERT INTO transactions (
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
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
          [
            'payment',
            student.student_id,
            transactionRef,
            amount,
            'USD',
            `Payment from ${student.full_name}`,
            data.date,
            student.boarding_house_id,
            1,
            'posted'
          ]
        );
        
        const transactionId = transactionResult.insertId;
        
        // Create journal entries
        // Debit: Cash
        await conn.query(
          `INSERT INTO journal_entries (
            transaction_id,
            account_id,
            entry_type,
            amount,
            description,
            boarding_house_id,
            created_by,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            transactionId,
            cashAccountId,
            'debit',
            amount,
            `Student payment - Debit Cash`,
            student.boarding_house_id,
            1
          ]
        );
        
        // Credit: Accounts Receivable
        await conn.query(
          `INSERT INTO journal_entries (
            transaction_id,
            account_id,
            entry_type,
            amount,
            description,
            boarding_house_id,
            created_by,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            transactionId,
            arAccountId,
            'credit',
            amount,
            `Student payment - Credit Accounts Receivable`,
            student.boarding_house_id,
            1
          ]
        );
        
        // Create student_payments record
        await conn.query(
          `INSERT INTO student_payments (
            student_id,
            enrollment_id,
            transaction_id,
            amount,
            payment_date,
            payment_method,
            payment_type,
            reference_number,
            notes,
            created_by,
            status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            student.student_id,
            student.enrollment_id,
            transactionId,
            amount,
            data.date,
            'cash_to_admin',
            'rent_payment',
            transactionRef,
            `Payment received from ${student.full_name}`,
            1,
            'completed'
          ]
        );
        
        createdCount++;
        totalCashInflow += amount;
        
        console.log(`  ✅ Payment ${i + 1}: $${amount} (${data.date})`);
      }
      
      if (processedStudents % 10 === 0) {
        console.log(`\nProcessed ${processedStudents}/${PAYMENT_DATA.length} students...\n`);
      }
    }
    
    console.log(`\n✅ Created ${createdCount} student payment transactions`);
    console.log(`✅ Processed ${processedStudents} students`);
    console.log(`✅ Total cash inflow: $${totalCashInflow.toFixed(2)}`);
    
    // Recalculate account balances
    console.log('\nRecalculating account balances...');
    const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');
    await recalculateAllAccountBalances();
    console.log('✅ Account balances recalculated');
    
    // Final verification
    const [finalCashBalance] = await conn.query(
      `SELECT current_balance FROM current_account_balances WHERE account_code = '10002'`
    );
    const [finalArBalance] = await conn.query(
      `SELECT current_balance FROM current_account_balances WHERE account_code = '10005'`
    );
    
    console.log(`\nFinal Cash balance: $${finalCashBalance[0]?.current_balance || 0}`);
    console.log(`Final AR balance: $${finalArBalance[0]?.current_balance || 0}`);
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

addAllPayments();
