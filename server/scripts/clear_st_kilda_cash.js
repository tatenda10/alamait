const db = require('../src/services/db');

async function clear() {
  const conn = await db.getConnection();
  try {
    console.log('Clearing St Kilda Cash transactions...');
    
    const [[house]] = await conn.query("SELECT id FROM boarding_houses WHERE LOWER(name) = 'st kilda' AND deleted_at IS NULL");
    
    if (!house) {
      throw new Error('St Kilda not found');
    }
    
    await conn.beginTransaction();
    
    // Soft delete journal entries for St Kilda cash transactions
    await conn.query(
      `UPDATE journal_entries 
       SET deleted_at = NOW() 
       WHERE transaction_id IN (
         SELECT id FROM transactions 
         WHERE boarding_house_id = ? 
         AND deleted_at IS NULL
         AND transaction_type IN ('opening_balance', 'expense', 'transfer_to_vault', 'transfer_from_vault')
         AND reference LIKE 'CASH-STK-%'
       )
       AND deleted_at IS NULL`,
      [house.id]
    );
    
    // Soft delete transactions
    await conn.query(
      `UPDATE transactions 
       SET deleted_at = NOW() 
       WHERE boarding_house_id = ? 
       AND deleted_at IS NULL
       AND transaction_type IN ('opening_balance', 'expense', 'transfer_to_vault', 'transfer_from_vault')
       AND reference LIKE 'CASH-STK-%'`,
      [house.id]
    );
    
    await conn.commit();
    
    console.log('✅ Cleared St Kilda cash transactions');
    console.log('Ready to reimport with corrected data.');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    console.error('❌ Error:', e);
    conn.release();
    process.exit(1);
  }
}

clear();

