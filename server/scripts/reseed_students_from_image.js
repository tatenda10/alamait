const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

// Student data extracted from image
const STUDENT_DATA = [
  { room: "M5", name: "Trypheane Chinembiri", rent: 180, admin_fee: 20 },
  { room: "M6", name: "Leona Dengu", rent: 180, admin_fee: 20 },
  { room: "C2", name: "Takudzwa Makunde", rent: 190, admin_fee: 20 },
  { room: "M7", name: "Kudzai Matare", rent: 180, admin_fee: 20 },
  { room: "M7", name: "Shantel Mashe", rent: 180, admin_fee: 20 },
  { room: "Ext 2", name: "Anita Gwenda", rent: 160, admin_fee: 20 },
  { room: "M4", name: "Lillian Chatikobo", rent: 180, admin_fee: 20 },
  { room: "M4", name: "Sharon Matanha", rent: 180, admin_fee: 20 },
  { room: "M1", name: "Bellis Mapetere", rent: 180, admin_fee: 20 },
  { room: "Ext 1", name: "Tatenda Kamatando", rent: 160, admin_fee: 20 },
  { room: "M8", name: "Fay Mubaiwa", rent: 160, admin_fee: 20 },
  { room: "Bus 1", name: "Christine Mutsikwa", rent: 160, admin_fee: 20 },
  { room: "Bus 2", name: "Bertha Mwangu", rent: 160, admin_fee: 20 },
  { room: "M5", name: "Merrylin Makunzva", rent: 180, admin_fee: 20 },
  { room: "M5", name: "Shantell Mavarira", rent: 180, admin_fee: 20 },
  { room: "M2", name: "Salina Saidi", rent: 170, admin_fee: 20 },
  { room: "M2", name: "Tinotenda Bwangangwanyo", rent: 170, admin_fee: 20 },
  { room: "M8", name: "Kimberly Nkomo", rent: 160, admin_fee: 20 },
  { room: "M4", name: "Kimberly Mutowembwa", rent: 180, admin_fee: 20 },
  { room: "M6", name: "Alicia Mutamuko", rent: 180, admin_fee: 20 },
  { room: "M7", name: "Tawana Kuwana", rent: 180, admin_fee: 20 },
  { room: "M6", name: "Bertha Majoni", rent: 180, admin_fee: 20 },
  { room: "M2", name: "Lorraine Mlambo", rent: 170, admin_fee: 20 },
  { room: "M2", name: "Tinotenda Magiga", rent: 170, admin_fee: 20 },
  { room: "Up 1", name: "Rumbidzai Manyaora", rent: 150, admin_fee: 20 },
  { room: "M8", name: "Precious Mashava", rent: 160, admin_fee: 20 },
  { room: "Bus 1", name: "Tanaka Chikonyera", rent: 160, admin_fee: 20 },
  { room: "UP 1", name: "Nyashadzashe Chinorwiwa", rent: 150, admin_fee: 20 },
  { room: "Bus 2", name: "Kimbely Bones", rent: 160, admin_fee: 20 },
  { room: "M1", name: "Natasha Chinho", rent: 180, admin_fee: 20 },
  { room: "Bus 2", name: "Tadiwa", rent: 160, admin_fee: 20 },
  { room: "M1", name: "Tadiwa Mhloro", rent: 180, admin_fee: 20 },
  { room: "Ext 1", name: "Varaidzo Tafirei", rent: 160, admin_fee: 20 },
  { room: "C2", name: "Precious Dziva", rent: 190, admin_fee: 20 },
  { room: "M3", name: "Shelter Masosonere", rent: 180, admin_fee: 20 },
  { room: "Ext 1", name: "Munashe", rent: 160, admin_fee: 20 },
  { room: "C1", name: "Sandra Chirinda", rent: 190, admin_fee: 20 },
  { room: "Ext 1", name: "Chantelle Gora", rent: 160, admin_fee: 20 },
  { room: "Ext 1", name: "Shalom Gora", rent: 160, admin_fee: 20 },
  { room: "M3", name: "Ruvimbo Singe", rent: 180, admin_fee: 20 },
  { room: "Ext 2", name: "Thelma Nzvimari", rent: 160, admin_fee: 20 },
  { room: "Bus 2", name: "Fadzai Mhizha", rent: 160, admin_fee: 20 },
  { room: "Up 2", name: "Kuziwa", rent: 120, admin_fee: 20 },
  { room: "M8", name: "Mitchel Chikosha", rent: 160, admin_fee: 20 },
  { room: "M8", name: "Vimbai", rent: 160, admin_fee: 20 },
  { room: "Bus 1", name: "Vannessa Magorimbo", rent: 160, admin_fee: 20 },
  { room: "Bus 1", name: "Agape Chiware", rent: 160, admin_fee: 20 },
  { room: "Bus 1", name: "Paidamoyo Munyimi", rent: 160, admin_fee: 20 },
  { room: "Ext 2", name: "Gracious", rent: 160, admin_fee: 20 },
  { room: "Ext 2", name: "Grace Vutika", rent: 160, admin_fee: 20 },
  { room: "M3", name: "Rachel Madembe", rent: 180, admin_fee: 20 },
  { room: "C1", name: "Pelagia Gomakalila", rent: 190, admin_fee: 20 },
  { room: "Ext 2", name: "Farai Muzembe", rent: 160, admin_fee: 20 },
  { room: "Bus 2", name: "Tinotenda Chidavaenzi", rent: 160, admin_fee: 20 },
  { room: "Ext 1", name: "Dion sengamai", rent: 160, admin_fee: 20 },
  { room: "Bus 1", name: "Emma Yoradin", rent: 160, admin_fee: 20 },
  { room: "M8", name: "Ropafadzo Masara", rent: 160, admin_fee: 20 },
  { room: "Exclusive", name: "Kudzai Pemhiwa", rent: 220, admin_fee: 20 }
];

const RESET_DATE = new Date(2025, 8, 1); // Sep 1, 2025
const DEFAULT_BOARDING_HOUSE_ID = 1;

async function main() {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    console.log('Step 1: Soft-deleting existing data...');
    
    // Soft delete journal entries for initial_invoice and admin_fee
    await conn.query(`
      UPDATE journal_entries je
      JOIN transactions t ON t.id = je.transaction_id
      SET je.deleted_at = NOW()
      WHERE je.deleted_at IS NULL
        AND t.transaction_type IN ('initial_invoice', 'admin_fee')
        AND t.deleted_at IS NULL;
    `);
    
    // Soft delete transactions
    await conn.query(`
      UPDATE transactions SET deleted_at = NOW()
      WHERE deleted_at IS NULL AND transaction_type IN ('initial_invoice', 'admin_fee');
    `);
    
    // Soft delete student invoices
    await conn.query(`UPDATE student_invoices SET deleted_at = NOW() WHERE deleted_at IS NULL;`);
    
    // Delete student account balances (hard delete as it's recalculated)
    await conn.query(`DELETE FROM student_account_balances;`);
    
    // Soft delete enrollments
    await conn.query(`UPDATE student_enrollments SET deleted_at = NOW() WHERE deleted_at IS NULL;`);
    
    // Soft delete students
    await conn.query(`UPDATE students SET deleted_at = NOW() WHERE deleted_at IS NULL;`);
    
    console.log('Step 2: Getting account IDs...');
    const [[recvAcct]] = await conn.query(`SELECT id FROM chart_of_accounts WHERE code='10005' AND deleted_at IS NULL`);
    const [[revAcct]] = await conn.query(`SELECT id FROM chart_of_accounts WHERE code='40001' AND deleted_at IS NULL`);
    
    if (!recvAcct || !revAcct) throw new Error('Required accounts 10005/40001 not found');
    
    console.log(`Step 3: Creating ${STUDENT_DATA.length} students...`);
    
    for (const data of STUDENT_DATA) {
      // Find or create room
      let [rooms] = await conn.query(
        `SELECT id, boarding_house_id FROM rooms WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND deleted_at IS NULL LIMIT 1`,
        [data.room]
      );
      
      let roomId, boardingHouseId;
      if (rooms.length === 0) {
        // Create room if missing
        const [roomRes] = await conn.query(
          `INSERT INTO rooms (name, boarding_house_id, capacity, bed_count, available_beds, price_per_bed, created_at, updated_at) VALUES (?, ?, 1, 1, 1, 0, NOW(), NOW())`,
          [data.room, DEFAULT_BOARDING_HOUSE_ID]
        );
        roomId = roomRes.insertId;
        boardingHouseId = DEFAULT_BOARDING_HOUSE_ID;
      } else {
        roomId = rooms[0].id;
        boardingHouseId = rooms[0].boarding_house_id;
      }
      
      // Create student
      const studentNumber = `STU${Date.now()}${Math.random().toString(36).slice(2,7)}`.toUpperCase();
      const [studentRes] = await conn.query(
        `INSERT INTO students (full_name, student_number, boarding_house_id, created_at)
         VALUES (?, ?, ?, NOW())`,
        [data.name, studentNumber, boardingHouseId]
      );
      const studentId = studentRes.insertId;
      
      // Create enrollment
      const [enrollRes] = await conn.query(
        `INSERT INTO student_enrollments (student_id, room_id, start_date, agreed_amount, admin_fee, currency, boarding_house_id, created_at)
         VALUES (?, ?, ?, ?, ?, 'USD', ?, NOW())`,
        [studentId, roomId, RESET_DATE, data.rent, data.admin_fee, boardingHouseId]
      );
      const enrollId = enrollRes.insertId;
      
      // Create transaction
      const invoiceTotal = data.rent + data.admin_fee;
      const txRef = `INV-RESEED-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      const [txRes] = await conn.query(
        `INSERT INTO transactions (transaction_type, student_id, reference, amount, currency, description, transaction_date, boarding_house_id, created_by, created_at, status)
         VALUES ('initial_invoice', ?, ?, ?, 'USD', ?, ?, ?, 1, NOW(), 'posted')`,
        [studentId, txRef, invoiceTotal, `Reseed invoice - ${data.name}`, RESET_DATE, boardingHouseId]
      );
      const txId = txRes.insertId;
      
      // Create journal entries
      await conn.query(
        `INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at)
         VALUES (?, ?, 'debit', ?, ?, ?, 1, NOW())`,
        [txId, recvAcct.id, invoiceTotal, `Reseed - Debit Receivable - ${data.name}`, boardingHouseId]
      );
      
      await conn.query(
        `INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at)
         VALUES (?, ?, 'credit', ?, ?, ?, 1, NOW())`,
        [txId, revAcct.id, invoiceTotal, `Reseed - Credit Revenue - ${data.name}`, boardingHouseId]
      );
      
      // Create student invoice
      await conn.query(
        `INSERT INTO student_invoices (student_id, enrollment_id, amount, description, invoice_date, reference_number, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [studentId, enrollId, invoiceTotal, `Reseed invoice September 2025`, RESET_DATE, txRef]
      );
      
      // Create student account balance
      await conn.query(
        `INSERT INTO student_account_balances (student_id, enrollment_id, current_balance, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [studentId, enrollId, -invoiceTotal]
      );
    }
    
    await conn.commit();
    console.log(`\nStep 4: Recomputing current_account_balances...`);
    await recalculateAllAccountBalances();
    
    console.log('\n✅ Reseed completed successfully.');
    console.log(`Created ${STUDENT_DATA.length} students with rooms, enrollments, invoices, and journals.`);
    process.exit(0);
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    console.error('❌ Reseed failed:', e);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
}

main();

