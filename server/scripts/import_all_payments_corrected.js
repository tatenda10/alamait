const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

// Complete payment data extracted from image - ALL payment columns included
const PAYMENT_DATA = [
  { name: 'Trypheane Chinembiri', payments: [{date:'2025-01-09',amount:100},{date:'2025-01-09',amount:180}] },
  { name: 'Leona Dengu', payments: [{date:'2025-01-09',amount:180}] },
  { name: 'Takudzwa Makunde', payments: [{date:'2025-01-09',amount:390}] },
  { name: 'Kudzai Matare', payments: [{date:'2025-01-09',amount:200}] },
  { name: 'Shantel Mashe', payments: [{date:'2025-01-09',amount:298}] },
  { name: 'Anita Gwenda', payments: [{date:'2025-01-09',amount:200},{date:'2025-01-09',amount:140}] },
  { name: 'Lillian Chatikobo', payments: [{date:'2025-01-09',amount:180},{date:'2025-01-09',amount:20}] },
  { name: 'Sharon Matanha', payments: [{date:'2025-01-09',amount:298}] },
  { name: 'Bellis Mapetere', payments: [{date:'2025-01-09',amount:200},{date:'2025-01-09',amount:180}] },
  { name: 'Tatenda Kamatando', payments: [{date:'2025-01-09',amount:220}] },
  { name: 'Fay Mubaiwa', payments: [{date:'2025-01-09',amount:215}] },
  { name: 'Christine Mutsikwa', payments: [{date:'2025-01-09',amount:180}] },
  { name: 'Bertha Mwangu', payments: [{date:'2025-01-09',amount:50},{date:'2025-01-09',amount:130}] },
  { name: 'Merrylin Makunzva', payments: [{date:'2025-02-09',amount:50},{date:'2025-02-09',amount:180}] },
  { name: 'Shantell Mavarira', payments: [{date:'2025-02-09',amount:50},{date:'2025-02-09',amount:150}] },
  { name: 'Salina Saidi', payments: [{date:'2025-02-09',amount:40},{date:'2025-02-09',amount:170}] },
  { name: 'Tinotenda Bwangangwanyo', payments: [{date:'2025-02-09',amount:80},{date:'2025-02-09',amount:120}] },
  { name: 'Kimberly Nkomo', payments: [{date:'2025-02-09',amount:100},{date:'2025-02-09',amount:80}] },
  { name: 'Kimberly Mutowembwa', payments: [{date:'2025-01-09',amount:200}] },
  { name: 'Alicia Mutamuko', payments: [{date:'2025-02-09',amount:50},{date:'2025-02-09',amount:150}] },
  { name: 'Tawana Kuwana', payments: [{date:'2025-02-09',amount:50},{date:'2025-02-09',amount:187}] },
  { name: 'Bertha Majoni', payments: [{date:'2025-02-09',amount:190}] },
  { name: 'Lorraine Mlambo', payments: [{date:'2025-02-09',amount:120},{date:'2025-02-09',amount:70}] },
  { name: 'Tinotenda Magiga', payments: [{date:'2025-02-09',amount:95},{date:'2025-02-09',amount:100}] },
  { name: 'Rumbidzai Manyaora', payments: [{date:'2025-02-09',amount:48},{date:'2025-02-09',amount:100},{date:'2025-02-09',amount:20}] },
  { name: 'Precious Mashava', payments: [{date:'2025-02-09',amount:180}] },
  { name: 'Tanaka Chikonyera', payments: [{date:'2025-08-09',amount:50},{date:'2025-08-09',amount:130}] },
  { name: 'Nyashadzashe Chinorwiwa', payments: [{date:'2025-08-09',amount:50},{date:'2025-08-09',amount:120}] },
  { name: 'Kimbely Bones', payments: [{date:'2025-08-09',amount:215}] },
  { name: 'Natasha Chinho', payments: [{date:'2025-08-09',amount:200},{date:'2025-08-09',amount:180}] },
  { name: 'Tadiwa', payments: [{date:'2025-08-09',amount:180}] },
  { name: 'Tadiwa Mhloro', payments: [{date:'2025-08-09',amount:300}] },
  { name: 'Varaidzo Tafirei', payments: [{date:'2025-08-09',amount:110}] },
  { name: 'Precious Dziva', payments: [{date:'2025-02-09',amount:153},{date:'2025-02-09',amount:190}] },
  { name: 'Shelter Masosonere', payments: [{date:'2025-02-09',amount:360},{date:'2025-02-09',amount:20}] },
  { name: 'Munashe', payments: [{date:'2025-02-09',amount:180},{date:'2025-02-09',amount:20}] },
  { name: 'Sandra Chirinda', payments: [{date:'2025-02-09',amount:250},{date:'2025-02-09',amount:240}] },
  { name: 'Chantelle Gora', payments: [{date:'2025-02-09',amount:50},{date:'2025-02-09',amount:95}] },
  { name: 'Shalom Gora', payments: [{date:'2025-02-09',amount:50},{date:'2025-02-09',amount:95}] },
  { name: 'Ruvimbo Singe', payments: [{date:'2025-02-09',amount:180},{date:'2025-02-09',amount:200}] },
  { name: 'Thelma Nzvimari', payments: [{date:'2025-02-09',amount:160},{date:'2025-02-09',amount:100}] },
  { name: 'Fadzai Mhizha', payments: [{date:'2025-01-09',amount:49},{date:'2025-01-09',amount:70}] },
  { name: 'Kuziwa', payments: [{date:'2025-01-09',amount:60},{date:'2025-01-09',amount:80}] },
  { name: 'Mitchel Chikosha', payments: [{date:'2025-01-09',amount:100},{date:'2025-01-09',amount:60},{date:'2025-01-09',amount:20}] },
  { name: 'Vimbai', payments: [{date:'2025-01-09',amount:180}] },
  { name: 'Vannessa Magorimbo', payments: [{date:'2025-02-09',amount:100},{date:'2025-02-09',amount:65},{date:'2025-02-09',amount:20}] },
  { name: 'Agape Chiware', payments: [{date:'2025-02-09',amount:180}] },
  { name: 'Paidamoyo Munyimi', payments: [{date:'2025-02-09',amount:500}] },
  { name: 'Gracious', payments: [{date:'2025-02-09',amount:180}] },
  { name: 'Grace Vutika', payments: [{date:'2025-02-09',amount:640}] },
  { name: 'Rachel Madembe', payments: [{date:'2025-02-09',amount:200},{date:'2025-02-09',amount:540}] },
  { name: 'Pelagia Gomakalila', payments: [{date:'2025-01-09',amount:210},{date:'2025-01-09',amount:190}] },
  { name: 'Farai Muzembe', payments: [{date:'2025-01-09',amount:220}] },
  { name: 'Tinotenda Chidavaenzi', payments: [{date:'2025-01-09',amount:200}] },
  { name: 'Dion sengamai', payments: [{date:'2025-01-09',amount:100}] },
  { name: 'Emma Yoradin', payments: [{date:'2025-02-09',amount:160}] },
  { name: 'Ropafadzo Masara', payments: [{date:'2025-02-09',amount:150}] },
  { name: 'Kudzai Pemhiwa', payments: [] }
];

const CASH_ACCOUNT_CODE = '10002';
const RECEIVABLE_ACCOUNT_CODE = '10005';

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
      
      if (data.payments.length === 0) {
        await conn.commit();
        continue;
      }
      
      const [students] = await conn.query(
        `SELECT id, boarding_house_id FROM students WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(?)) AND deleted_at IS NULL LIMIT 1`,
        [data.name]
      );
      
      if (students.length === 0) {
        console.log(`Warning: Student not found: ${data.name}`);
        await conn.commit();
        continue;
      }
      
      const studentId = students[0].id;
      const boardingHouseId = students[0].boarding_house_id;
      
      let paymentIndex = 0;
      for (const pmt of data.payments) {
        if (pmt.amount <= 0) continue;
        
        paymentIndex++;
        const txRef = `PAY-${data.name.slice(0,5)}-${pmt.date}-${paymentIndex}`;
        
        const [txRes] = await conn.query(
          `INSERT INTO transactions (transaction_type, student_id, reference, amount, currency, description, transaction_date, boarding_house_id, created_by, created_at, status)
           VALUES ('payment', ?, ?, ?, 'USD', ?, ?, ?, 1, NOW(), 'posted')`,
          [studentId, txRef, pmt.amount, `Payment from ${data.name}`, pmt.date, boardingHouseId]
        );
        const txId = txRes.insertId;
        
        await conn.query(
          `INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at)
           VALUES (?, ?, 'debit', ?, ?, ?, 1, NOW())`,
          [txId, cashAcct.id, pmt.amount, `Payment - Debit Cash - ${data.name}`, boardingHouseId]
        );
        
        await conn.query(
          `INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at)
           VALUES (?, ?, 'credit', ?, ?, ?, 1, NOW())`,
          [txId, recvAcct.id, pmt.amount, `Payment - Credit Receivable - ${data.name}`, boardingHouseId]
        );
        
        await conn.query(
          `UPDATE student_account_balances 
           SET current_balance = current_balance + ?,
               updated_at = NOW()
           WHERE student_id = ?`,
          [pmt.amount, studentId]
        );
        
        totalPayments++;
        totalAmount += pmt.amount;
      }
      
      await conn.commit();
    }
    
    console.log(`\nStep 3: Recomputing current_account_balances...`);
    await recalculateAllAccountBalances();
    
    console.log('\n✅ Payment import completed successfully.');
    console.log(`Processed ${totalPayments} payments totaling $${totalAmount.toFixed(2)}`);
    console.log(`Expected total: $17,066.00`);
    console.log(`Difference: $${(17066 - totalAmount).toFixed(2)}`);
    
    process.exit(0);
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    console.error('❌ Payment import failed:', e);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
}

main();

