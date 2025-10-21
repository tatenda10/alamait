const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

// Payment data extracted from image (date, name, amounts)
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
  { date: '2025-01-09', name: 'Pelagia Gomakalila', payments: [190, 210] },
  { date: '2025-01-09', name: 'Agape Chiware', payments: [180] },
  { date: '2025-01-09', name: 'Tadiwa Mhloro', payments: [20, 20, 20, 180, 20, 20, 200, 20, 20] },
  { date: '2025-01-09', name: 'Shantel Mashe', payments: [20, 20, 20, 20, 20, 20, 20, 20] }
];

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Getting required account IDs...');
    
    // Get required account IDs
    const [[cashAccount]] = await conn.query("SELECT id FROM chart_of_accounts WHERE code = '10002' AND deleted_at IS NULL");
    const [[arAccount]] = await conn.query("SELECT id FROM chart_of_accounts WHERE code = '10005' AND deleted_at IS NULL");
    const [[boardingHouse]] = await conn.query("SELECT id FROM boarding_houses WHERE LOWER(name) = 'st kilda' AND deleted_at IS NULL");
    
    if (!cashAccount || !arAccount || !boardingHouse) {
      throw new Error('Required accounts or boarding house not found');
    }
    
    console.log(`Cash Account ID: ${cashAccount.id}`);
    console.log(`AR Account ID: ${arAccount.id}`);
    console.log(`Boarding House ID: ${boardingHouse.id}`);
    
    console.log('\nStep 2: Processing student payments...');
    
    let totalPayments = 0;
    let processedStudents = 0;
    let totalTransactions = 0;
    let notFoundStudents = [];
    
    for (const studentData of PAYMENT_DATA) {
      // Find student with better matching
      const [students] = await conn.query(
        `SELECT s.id as student_id, se.id as enrollment_id, s.full_name 
         FROM students s 
         JOIN student_enrollments se ON s.id = se.student_id 
         WHERE s.deleted_at IS NULL AND se.deleted_at IS NULL
         AND (
           LOWER(TRIM(s.full_name)) = LOWER(TRIM(?)) OR
           LOWER(s.full_name) LIKE LOWER(?) OR
           LOWER(?) LIKE LOWER(s.full_name)
         )
         LIMIT 1`,
        [studentData.name, `%${studentData.name}%`, `%${studentData.name}%`]
      );
      
      if (students.length === 0) {
        notFoundStudents.push(studentData.name);
        console.log(`  ⚠️  Student not found: ${studentData.name}`);
        continue;
      }
      
      const student = students[0];
      processedStudents++;
      console.log(`  ✅ Found: ${student.full_name} (ID: ${student.student_id})`);
      
      // Process each payment for this student
      for (const paymentAmount of studentData.payments) {
        await conn.beginTransaction();
        
        const transactionRef = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create payment transaction
        const [txResult] = await conn.query(
          `INSERT INTO transactions (
            transaction_type, boarding_house_id, reference, amount, currency, 
            description, transaction_date, created_by, created_at, status
          ) VALUES (?, ?, ?, ?, 'USD', ?, '2025-09-01', 1, NOW(), 'posted')`,
          ['payment', boardingHouse.id, transactionRef, paymentAmount, `Payment from ${studentData.name}`]
        );
        const transactionId = txResult.insertId;
        
        // Create journal entries: Debit Cash, Credit Accounts Receivable
        await conn.query(
          `INSERT INTO journal_entries (
            transaction_id, account_id, entry_type, amount, description, 
            boarding_house_id, created_by, created_at
          ) VALUES (?, ?, 'debit', ?, ?, ?, ?, NOW())`,
          [transactionId, cashAccount.id, paymentAmount, `Payment from ${studentData.name} - Debit`, boardingHouse.id, 1]
        );
        
        await conn.query(
          `INSERT INTO journal_entries (
            transaction_id, account_id, entry_type, amount, description, 
            boarding_house_id, created_by, created_at
          ) VALUES (?, ?, 'credit', ?, ?, ?, ?, NOW())`,
          [transactionId, arAccount.id, paymentAmount, `Payment from ${studentData.name} - Credit`, boardingHouse.id, 1]
        );
        
        // Create student_payments record
        await conn.query(
          `INSERT INTO student_payments (
            student_id, enrollment_id, transaction_id, amount, payment_date, 
            payment_method, payment_type, reference_number, notes, created_by, status
          ) VALUES (?, ?, ?, ?, '2025-09-01', 'cash_to_admin', 'rent_payment', ?, ?, 1, 'completed')`,
          [student.student_id, student.enrollment_id, transactionId, paymentAmount, transactionRef, `Payment received from ${studentData.name}`]
        );
        
        totalPayments += paymentAmount;
        totalTransactions++;
        
        await conn.commit();
      }
    }
    
    console.log(`\n✅ Processed ${processedStudents} students`);
    console.log(`✅ Created ${totalTransactions} payment transactions`);
    console.log(`✅ Total payment amount: $${totalPayments.toFixed(2)}`);
    
    if (notFoundStudents.length > 0) {
      console.log(`\n⚠️  Students not found (${notFoundStudents.length}):`);
      notFoundStudents.forEach(name => console.log(`  - ${name}`));
    }
    
    console.log('\nStep 3: Recalculating account balances...');
    await recalculateAllAccountBalances();
    
    console.log('\nStep 4: Verifying balances...');
    
    // Check key account balances
    const [keyBalances] = await conn.query(
      `SELECT 
        coa.code,
        coa.name,
        cab.current_balance
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      WHERE coa.code IN ('10002', '10005', '40001')
      ORDER BY coa.code`
    );
    
    console.log(`\nKey Account Balances:`);
    keyBalances.forEach(acc => {
      console.log(`  ${acc.code}: ${acc.name} - $${parseFloat(acc.current_balance || 0).toFixed(2)}`);
    });
    
    // Check trial balance
    const [journalTotals] = await conn.query(
      `SELECT 
        SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) as total_credits
      FROM journal_entries 
      WHERE deleted_at IS NULL`
    );
    
    const totalDebits = parseFloat(journalTotals[0]?.total_debits || 0);
    const totalCredits = parseFloat(journalTotals[0]?.total_credits || 0);
    const difference = totalDebits - totalCredits;
    
    console.log(`\nTrial Balance:`);
    console.log(`  Total Debits: $${totalDebits.toFixed(2)}`);
    console.log(`  Total Credits: $${totalCredits.toFixed(2)}`);
    console.log(`  Difference: $${difference.toFixed(2)}`);
    console.log(`  Balanced: ${Math.abs(difference) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n✅ Correct student payments restored!');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Restoration failed:', e);
    conn.release();
    process.exit(1);
  }
}

main();
