const db = require('../src/services/db');

async function clear() {
  const conn = await db.getConnection();
  try {
    console.log('Clearing Marko\'s St Kilda petty cash transactions...');
    
    // Get Marko's user ID and St Kilda ID
    const [[user]] = await conn.query("SELECT id FROM users WHERE LOWER(username) = 'marko' AND deleted_at IS NULL");
    const [[house]] = await conn.query("SELECT id FROM boarding_houses WHERE LOWER(name) = 'st kilda' AND deleted_at IS NULL");
    
    if (!user || !house) {
      throw new Error('User or boarding house not found');
    }
    
    await conn.beginTransaction();
    
    // Delete petty cash transactions
    await conn.query(
      "DELETE FROM petty_cash_transactions WHERE user_id = ? AND boarding_house_id = ?",
      [user.id, house.id]
    );
    
    // Soft delete journal entries for petty cash transactions
    await conn.query(
      `UPDATE journal_entries 
       SET deleted_at = NOW() 
       WHERE transaction_id IN (
         SELECT id FROM transactions 
         WHERE boarding_house_id = ? 
         AND created_by = ? 
         AND deleted_at IS NULL
         AND transaction_type IN ('opening_balance', 'cash_inflow', 'expense')
       )
       AND deleted_at IS NULL`,
      [house.id, user.id]
    );
    
    // Soft delete transactions
    await conn.query(
      `UPDATE transactions 
       SET deleted_at = NOW() 
       WHERE boarding_house_id = ? 
       AND created_by = ? 
       AND deleted_at IS NULL
       AND transaction_type IN ('opening_balance', 'cash_inflow', 'expense')`,
      [house.id, user.id]
    );
    
    // Reset petty cash account
    await conn.query(
      `UPDATE petty_cash_accounts 
       SET current_balance = 0, 
           beginning_balance = 0,
           total_inflows = 0,
           total_outflows = 0,
           updated_at = NOW()
       WHERE user_id = ? AND boarding_house_id = ? AND deleted_at IS NULL`,
      [user.id, house.id]
    );
    
    await conn.commit();
    
    console.log('✅ Cleared all petty cash transactions for Marko at St Kilda');
    console.log('Ready to reimport with correct dates.');
    
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

