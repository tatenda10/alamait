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
  { date: '2025-02-09', name: 'Kudzai Pemhiwa', payments: [] }
];

const DEFAULT_PAYMENT_METHOD = 'cash'; // or 'bank_transfer'
const CASH_ACCOUNT_CODE = '10002'; // Cash account
const RECEIVABLE_ACCOUNT_CODE = '10005'; // Accounts Receivable

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Step 1: Getting account IDs...');
    const [[cashAcct]] = await conn.query(`SELECT id FROM chart_of_accounts WHERE code=? AND deleted_at IS NULL`, [CASH_ACCOUNT_CODE]);
    const [[recvAcct]] = await conn.query(`SELECT id FROM chart_of_accounts WHERE code=? AND deleted_at IS NULL`, [RECEIVABLE_ACCOUNT_CODE]);
    
    if (!cashAcct || !recvAcct) throw new Error('Required accounts not found');
    
    console.log(`Step 2: Processing payments for ${PAYMENT_DATA.length} students...`);
    
    let totalPayments = 0;
    let totalAmount = 0;
    let processedCount = 0;
    
    for (const data of PAYMENT_DATA) {
      await conn.beginTransaction();
      
      processedCount++;
      if (processedCount % 10 === 0) {
        console.log(`  Processed ${processedCount}/${PAYMENT_DATA.length} students...`);
      }
      
      if (data.payments.length === 0) continue;
      
      // Find student
      const [students] = await conn.query(
        `SELECT id, boarding_house_id FROM students WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(?)) AND deleted_at IS NULL LIMIT 1`,
        [data.name]
      );
      
      if (students.length === 0) {
        console.log(`Warning: Student not found: ${data.name}`);
        continue;
      }
      
      const studentId = students[0].id;
      const boardingHouseId = students[0].boarding_house_id;
      
      // Process each payment for this student
      let paymentIndex = 0;
      for (const amount of data.payments) {
        if (amount <= 0) continue;
        
        paymentIndex++;
        const txRef = `PAY-${data.name.slice(0,5)}-${data.date}-${paymentIndex}`;
        
        console.log(`    Creating payment: ${data.name} - $${amount} on ${data.date}`);
        
        // Create transaction
        const [txRes] = await conn.query(
          `INSERT INTO transactions (transaction_type, student_id, reference, amount, currency, description, transaction_date, boarding_house_id, created_by, created_at, status)
           VALUES ('payment', ?, ?, ?, 'USD', ?, ?, ?, 1, NOW(), 'posted')`,
          [studentId, txRef, amount, `Payment from ${data.name}`, data.date, boardingHouseId]
        );
        const txId = txRes.insertId;
        
        // Create journal entries
        // Debit: Cash (increase cash)
        await conn.query(
          `INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at)
           VALUES (?, ?, 'debit', ?, ?, ?, 1, NOW())`,
          [txId, cashAcct.id, amount, `Payment received - Debit Cash - ${data.name}`, boardingHouseId]
        );
        
        // Credit: Accounts Receivable (reduce receivable)
        await conn.query(
          `INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at)
           VALUES (?, ?, 'credit', ?, ?, ?, 1, NOW())`,
          [txId, recvAcct.id, amount, `Payment received - Credit Receivable - ${data.name}`, boardingHouseId]
        );
        
        // Update student account balance (increase balance by payment amount)
        await conn.query(
          `UPDATE student_account_balances 
           SET current_balance = current_balance + ?,
               updated_at = NOW()
           WHERE student_id = ?`,
          [amount, studentId]
        );
        
        totalPayments++;
        totalAmount += amount;
      }
      
      await conn.commit();
    }
    
    console.log(`\nStep 3: Recomputing current_account_balances...`);
    await recalculateAllAccountBalances();
    
    console.log('\n✅ Payment import completed successfully.');
    console.log(`Processed ${totalPayments} payments totaling $${totalAmount.toFixed(2)}`);
    
    process.exit(0);
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    console.error('❌ Payment import failed:', e);
    console.error('Stack:', e.stack);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
}

main();

