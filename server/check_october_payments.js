require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkOctoberPayments() {
  console.log('🔍 Checking October 2025 Payments...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Check for payment transactions in October
    console.log('📋 OCTOBER PAYMENT TRANSACTIONS:');
    const [paymentTransactions] = await connection.execute(`
      SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        s.full_name as student_name,
        t.created_at
      FROM transactions t
      LEFT JOIN students s ON t.student_id = s.id
      WHERE t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
        AND t.transaction_type = 'payment'
      ORDER BY t.transaction_date, s.full_name
    `);
    
    if (paymentTransactions.length > 0) {
      console.table(paymentTransactions);
      
      const totalPayments = paymentTransactions.reduce((sum, pmt) => sum + parseFloat(pmt.amount), 0);
      console.log(`\n💰 TOTAL PAYMENTS: $${totalPayments.toFixed(2)}`);
      console.log(`📊 NUMBER OF PAYMENTS: ${paymentTransactions.length}`);
    } else {
      console.log('⚠️  NO payment transactions found for October 2025');
    }

    // Check student_payments table
    console.log('\n\n📋 OCTOBER STUDENT PAYMENT RECORDS:');
    const [studentPayments] = await connection.execute(`
      SELECT 
        sp.id,
        s.full_name as student_name,
        sp.amount,
        sp.payment_date,
        sp.payment_method,
        sp.payment_type,
        sp.notes,
        sp.status,
        sp.created_at
      FROM student_payments sp
      JOIN students s ON sp.student_id = s.id
      WHERE sp.payment_date >= '2025-10-01'
        AND sp.payment_date <= '2025-10-31'
        AND sp.deleted_at IS NULL
      ORDER BY sp.payment_date, s.full_name
    `);
    
    if (studentPayments.length > 0) {
      console.table(studentPayments);
      
      const totalFromPayments = studentPayments.reduce((sum, pmt) => sum + parseFloat(pmt.amount), 0);
      console.log(`\n💰 TOTAL FROM STUDENT_PAYMENTS: $${totalFromPayments.toFixed(2)}`);
      console.log(`📊 NUMBER OF RECORDS: ${studentPayments.length}`);
    } else {
      console.log('⚠️  NO records in student_payments table for October 2025');
    }

    // Check journal entries for payments (should have Debit: Cash/Bank, Credit: Accounts Receivable)
    console.log('\n\n📒 OCTOBER PAYMENT JOURNAL ENTRIES:');
    const [paymentJournals] = await connection.execute(`
      SELECT 
        je.id,
        je.transaction_id,
        t.reference,
        coa.code,
        coa.name as account_name,
        je.entry_type,
        je.amount,
        t.transaction_date
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
        AND t.transaction_type = 'payment'
        AND je.deleted_at IS NULL
      ORDER BY t.transaction_date, je.transaction_id, je.entry_type DESC
    `);
    
    if (paymentJournals.length > 0) {
      console.table(paymentJournals);
      console.log(`\n📊 TOTAL JOURNAL ENTRIES: ${paymentJournals.length}`);
    } else {
      console.log('⚠️  NO payment journal entries found for October 2025');
    }

    // Summary breakdown by payment method
    console.log('\n\n📊 PAYMENT BREAKDOWN BY METHOD:');
    const [paymentBreakdown] = await connection.execute(`
      SELECT 
        sp.payment_method,
        COUNT(*) as count,
        SUM(sp.amount) as total
      FROM student_payments sp
      WHERE sp.payment_date >= '2025-10-01'
        AND sp.payment_date <= '2025-10-31'
        AND sp.deleted_at IS NULL
      GROUP BY sp.payment_method
      ORDER BY sp.payment_method
    `);
    
    if (paymentBreakdown.length > 0) {
      console.table(paymentBreakdown);
    }

    // List of students from our payment list who should have payments
    const expectedPayments = [
      'Christine Mutsikwa', 'Tanaka Chikonyera', 'Vannessa Magorimbo', 'Agape Chiware',
      'Emma Yoradin', 'Bertha Mwangu', 'Kimbely Bones', 'Tadiwa', 'Fadzai Mhizha',
      'Tinotenda Chidavaenzi', 'Pelagia Gomakalila', 'Takudzwa Makunde', 'Precious Dziva',
      'Tatenda Kamatando', 'Chantelle Gora', 'Shalom Gora', 'Dion sengamai',
      'Charmain Tinarwo', 'Anita Gwenda', 'Thelma Nzvimari', 'Farai Muzembe',
      'Bellis Mapetere', 'Tadiwa Mhloro', 'Salina Saidi', 'Tinotenda Bwangangwanyo',
      'Lorraine Mlambo', 'Tinotenda Magiga', 'Munashe', 'Ruvimbo Singe',
      'Lillian Chatikobo', 'Sharon Matanha', 'Kimberly Mutowembwa', 'Trypheane Chinembiri',
      'Merrylin Makunzva', 'Shantell Mawarira', 'Alicia Mutamuko', 'Bertha Majoni',
      'Tanaka Matematema', 'Kudzai Matare', 'Shantel Mashe', 'Fay Mubaiwa',
      'Kimberly Nkomo', 'Precious Mashava', 'Mitchel Chikosha', 'Vimbai',
      'Ropafadzo Masara', 'Rumbidzai Manyaora', 'Nyashadzashe Chinorwiwa', 'Kuziwa'
    ];

    console.log('\n\n🔍 CHECKING FOR MISSING PAYMENTS:');
    let foundCount = 0;
    let missingCount = 0;
    const missing = [];

    for (const studentName of expectedPayments) {
      const found = studentPayments.find(sp => 
        sp.student_name && sp.student_name.toLowerCase().includes(studentName.toLowerCase())
      );
      if (found) {
        foundCount++;
      } else {
        missingCount++;
        missing.push(studentName);
      }
    }

    console.log(`✅ Found payments for: ${foundCount} students`);
    console.log(`❌ Missing payments for: ${missingCount} students`);
    
    if (missing.length > 0) {
      console.log('\n⚠️  Students with missing payments:');
      missing.forEach(name => console.log(`  - ${name}`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

checkOctoberPayments();

